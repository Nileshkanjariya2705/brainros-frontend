import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  acquireAccurateLocation,
  getAccuracyStatus,
  formatGeoErrorMessage,
} from './geoAccuracy';

describe('geoAccuracy - High-Accuracy Geolocation Engine', () => {
  let originalGeolocation: Geolocation;

  beforeEach(() => {
    vi.useFakeTimers();
    originalGeolocation = navigator.geolocation;
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      writable: true,
      configurable: true,
    });
  });

  describe('getAccuracyStatus', () => {
    it('returns high precision tier for accuracy <= 30m', () => {
      const status = getAccuracyStatus(12.4);
      expect(status.level).toBe('high');
      expect(status.label).toContain('High Precision GPS');
      expect(status.label).toContain('±12m');
      expect(status.badgeColor).toContain('emerald');
    });

    it('returns refined tier for accuracy between 31m and 150m', () => {
      const status = getAccuracyStatus(75);
      expect(status.level).toBe('moderate');
      expect(status.label).toContain('Refined Location');
      expect(status.label).toContain('±75m');
      expect(status.badgeColor).toContain('amber');
    });

    it('returns coarse tier for accuracy > 150m', () => {
      const status = getAccuracyStatus(1200);
      expect(status.level).toBe('coarse');
      expect(status.label).toContain('Approximate Location');
      expect(status.label).toContain('±1200m');
      expect(status.badgeColor).toContain('rose');
    });
  });

  describe('formatGeoErrorMessage', () => {
    it('formats code 1 as permission denied with guidance', () => {
      const msg = formatGeoErrorMessage({ code: 1, message: 'User denied Geolocation' });
      expect(msg).toContain('permission was denied');
      expect(msg).toContain('browser settings');
    });

    it('formats code 2 as position unavailable with GPS radio guidance', () => {
      const msg = formatGeoErrorMessage({ code: 2, message: 'Position unavailable' });
      expect(msg).toContain('GPS / Location signal is currently unavailable');
    });

    it('formats code 3 as timeout with retry prompt', () => {
      const msg = formatGeoErrorMessage({ code: 3, message: 'Timeout expired' });
      expect(msg).toContain('satellite search timed out');
      expect(msg).toContain('Refresh GPS');
    });
  });

  describe('acquireAccurateLocation', () => {
    it('resolves immediately when high-accuracy satellite lock (accuracy <= targetAccuracy) is returned', async () => {
      let watchCallback: (pos: any) => void = () => {};
      const clearWatchMock = vi.fn();

      const mockGeolocation = {
        watchPosition: vi.fn((success) => {
          watchCallback = success;
          return 42;
        }),
        clearWatch: clearWatchMock,
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true,
      });

      const acquirePromise = acquireAccurateLocation({ targetAccuracyMeters: 25 });

      // Simulate a high-accuracy satellite fix (15m accuracy)
      watchCallback({
        coords: {
          latitude: 19.0760,
          longitude: 72.8777,
          accuracy: 15,
          altitude: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      const result = await acquirePromise;
      expect(result.latitude).toBe(19.0760);
      expect(result.longitude).toBe(72.8777);
      expect(result.accuracy).toBe(15);
      expect(result.isHighAccuracy).toBe(true);
      expect(clearWatchMock).toHaveBeenCalledWith(42);
    });

    it('refines coarse initial fix and adopts fine satellite fix when emitted', async () => {
      let watchCallback: (pos: any) => void = () => {};
      const onProgressMock = vi.fn();

      const mockGeolocation = {
        watchPosition: vi.fn((success) => {
          watchCallback = success;
          return 99;
        }),
        clearWatch: vi.fn(),
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true,
      });

      const acquirePromise = acquireAccurateLocation({
        targetAccuracyMeters: 25,
        onProgress: onProgressMock,
      });

      // 1. First fix: Coarse cellular tower fix (accuracy 2500m)
      watchCallback({
        coords: {
          latitude: 19.0800,
          longitude: 72.8800,
          accuracy: 2500,
          altitude: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      expect(onProgressMock).toHaveBeenCalledWith(
        expect.objectContaining({ accuracy: 2500 }),
      );

      // 2. Second fix: Converged high-precision satellite fix (accuracy 8m)
      watchCallback({
        coords: {
          latitude: 19.07609,
          longitude: 72.87772,
          accuracy: 8,
          altitude: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      const result = await acquirePromise;
      expect(result.latitude).toBe(19.07609);
      expect(result.longitude).toBe(72.87772);
      expect(result.accuracy).toBe(8);
      expect(result.isHighAccuracy).toBe(true);
    });

    it('resolves with the best moderate fix after refinement window expires', async () => {
      let watchCallback: (pos: any) => void = () => {};

      const mockGeolocation = {
        watchPosition: vi.fn((success) => {
          watchCallback = success;
          return 101;
        }),
        clearWatch: vi.fn(),
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true,
      });

      const acquirePromise = acquireAccurateLocation({
        targetAccuracyMeters: 20,
        maxWaitTimeMs: 4000,
      });

      // Emit a moderate accuracy fix (50m, which is > 20 but <= 80)
      watchCallback({
        coords: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 50,
          altitude: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      // Fast forward refinement timer by 4500ms
      vi.advanceTimersByTime(4500);

      const result = await acquirePromise;
      expect(result.latitude).toBe(12.9716);
      expect(result.longitude).toBe(77.5946);
      expect(result.accuracy).toBe(50);
    });

    it('rejects with user-friendly message when permission is denied and no prior fix was received', async () => {
      let errorCallback: (err: any) => void = () => {};

      const mockGeolocation = {
        watchPosition: vi.fn((_success, error) => {
          errorCallback = error;
          return 102;
        }),
        clearWatch: vi.fn(),
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true,
      });

      const acquirePromise = acquireAccurateLocation();

      errorCallback({ code: 1, message: 'User denied Geolocation' });

      await expect(acquirePromise).rejects.toThrow(/permission was denied/i);
    });
  });
});

