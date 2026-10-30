/**
 * High-Accuracy Geolocation Acquisition Engine
 * 
 * Uses progressive satellite convergence via `watchPosition` rather than a single-shot
 * `getCurrentPosition`, preventing coarse Wi-Fi / cellular tower locks (which can be 500m-25km off).
 * Tracks real-time GPS fixes, converges towards satellite-level accuracy (<= 25m),
 * and gracefully falls back to the best available fix if satellite lock takes longer.
 */

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  altitude?: number | null;
  speed?: number | null;
  timestamp: number;
  isHighAccuracy: boolean;
}

export interface GeoAccuracyStatus {
  level: 'high' | 'moderate' | 'coarse';
  label: string;
  badgeColor: string; // Tailwind color class
  description: string;
}

export interface AcquireLocationOptions {
  targetAccuracyMeters?: number; // Accept immediately if accuracy <= this (default: 25)
  maxWaitTimeMs?: number; // Maximum time to wait for refinement (default: 10000ms)
  timeoutMs?: number; // Hard timeout for any position (default: 18000ms)
  onProgress?: (bestSoFar: GeoLocationResult) => void;
}

/**
 * Classifies location accuracy into user-friendly status tiers
 */
export function getAccuracyStatus(accuracyMeters: number): GeoAccuracyStatus {
  if (accuracyMeters <= 30) {
    return {
      level: 'high',
      label: `High Precision GPS (±${Math.round(accuracyMeters)}m)`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      description: 'Satellite GPS locked with high on-site precision.',
    };
  }

  if (accuracyMeters <= 150) {
    return {
      level: 'moderate',
      label: `Refined Location (±${Math.round(accuracyMeters)}m)`,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      description: 'Good location signal. Minor satellite refinement may still occur.',
    };
  }

  return {
    level: 'coarse',
    label: `Approximate Location (±${Math.round(accuracyMeters)}m)`,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    description: 'Network / cellular location estimate. Move near a window or outdoors for GPS satellite lock.',
  };
}

/**
 * Formats user-friendly error messages from GeolocationPositionError
 */
export function formatGeoErrorMessage(error: any): string {
  if (!error) return 'Unable to retrieve your current location.';

  // Code 1: PERMISSION_DENIED
  if (error.code === 1 || error.name === 'NotAllowedError') {
    return 'Location permission was denied. Please allow location access in your browser settings (look for the lock/settings icon in the address bar).';
  }

  // Code 2: POSITION_UNAVAILABLE
  if (error.code === 2) {
    return 'GPS / Location signal is currently unavailable. Please ensure your device GPS / Location is switched ON with High Accuracy.';
  }

  // Code 3: TIMEOUT
  if (error.code === 3) {
    return 'GPS satellite search timed out. Please click "Refresh GPS" or move to an open area with clear sky view.';
  }

  return error.message || 'Unable to acquire accurate GPS coordinates.';
}

/**
 * Progressively acquires the most accurate GPS location available.
 */
export async function acquireAccurateLocation(
  options: AcquireLocationOptions = {},
): Promise<GeoLocationResult> {
  const {
    targetAccuracyMeters = 25,
    maxWaitTimeMs = 8000,
    timeoutMs = 18000,
    onProgress,
  } = options;

  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  return new Promise<GeoLocationResult>((resolve, reject) => {
    let bestResult: GeoLocationResult | null = null;
    let watchId: number | null = null;
    let hardTimeoutId: any = null;
    let refinementTimeoutId: any = null;
    let isSettled = false;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (hardTimeoutId) {
        clearTimeout(hardTimeoutId);
        hardTimeoutId = null;
      }
      if (refinementTimeoutId) {
        clearTimeout(refinementTimeoutId);
        refinementTimeoutId = null;
      }
    };

    const finish = (result: GeoLocationResult) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      resolve(result);
    };

    const fail = (err: any) => {
      if (isSettled) return;
      if (bestResult) {
        // If we already have any position reading, resolve with best instead of failing
        finish(bestResult);
        return;
      }
      isSettled = true;
      cleanup();
      reject(new Error(formatGeoErrorMessage(err)));
    };

    // Hard timeout safety net
    hardTimeoutId = setTimeout(() => {
      if (bestResult) {
        finish(bestResult);
      } else {
        fail({ code: 3, message: 'Location acquisition timed out.' });
      }
    }, timeoutMs);

    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = position.coords;
          const currentResult: GeoLocationResult = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            speed: coords.speed,
            timestamp: position.timestamp,
            isHighAccuracy: coords.accuracy <= 30,
          };

          // If this is the first result or it is more accurate than previous
          if (!bestResult || currentResult.accuracy < bestResult.accuracy) {
            bestResult = currentResult;
            if (onProgress) {
              onProgress(currentResult);
            }
          }

          // Case A: Satellite lock achieved with high accuracy (<= targetAccuracyMeters)
          if (currentResult.accuracy <= targetAccuracyMeters) {
            finish(currentResult);
            return;
          }

          // Case B: Moderate accuracy (<= 80m). Start refinement grace timer if not already running
          if (currentResult.accuracy <= 80 && !refinementTimeoutId) {
            refinementTimeoutId = setTimeout(() => {
              if (bestResult) {
                finish(bestResult);
              }
            }, maxWaitTimeMs);
          }
        },
        (error) => {
          // If we already have a fix, don't fail immediately on transient GPS error
          if (!bestResult) {
            fail(error);
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: timeoutMs,
        },
      );
    } catch (e) {
      fail(e);
    }
  });
}

