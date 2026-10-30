import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reverseGeocodeCoordinates } from './reverseGeocoding';

describe('reverseGeocoding - Multi-Tier Geocoder', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('Tier 1: correctly extracts city, district, state, country from BigDataCloud response', async () => {
    const mockBdcData = {
      city: 'Pune',
      locality: 'Shivajinagar',
      principalSubdivision: 'Maharashtra',
      countryName: 'India',
      postcode: '411005',
      localityInfo: {
        administrative: [
          { name: 'India', adminLevel: 2 },
          { name: 'Maharashtra', adminLevel: 4 },
          { name: 'Pune District', adminLevel: 5, description: 'district of Maharashtra' },
        ],
      },
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('bigdatacloud')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBdcData),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const result = await reverseGeocodeCoordinates(18.5204, 73.8567);

    expect(result.city).toBe('Pune');
    expect(result.district).toBe('Pune District');
    expect(result.state).toBe('Maharashtra');
    expect(result.country).toBe('India');
    expect(result.formattedAddress).toContain('Shivajinagar');
    expect(result.formattedAddress).toContain('Pune');
    expect(result.formattedAddress).toContain('Maharashtra');
  });

  it('Tier 2: seamlessly falls back to OpenStreetMap Nominatim if BigDataCloud fails', async () => {
    const mockOsmData = {
      display_name: 'St. Xavier High School, Navrangpura, Ahmedabad, Gujarat, 380009, India',
      address: {
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        postcode: '380009',
        suburb: 'Navrangpura',
      },
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('bigdatacloud')) {
        // Simulate network failure on Tier 1
        return Promise.reject(new Error('Network error on BDC'));
      }
      if (url.includes('nominatim.openstreetmap.org')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOsmData),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const result = await reverseGeocodeCoordinates(23.0225, 72.5714);

    expect(result.city).toBe('Ahmedabad');
    expect(result.state).toBe('Gujarat');
    expect(result.country).toBe('India');
    expect(result.formattedAddress).toContain('St. Xavier High School');
  });

  it('Tier 3: returns clean formatted coordinate fallback when both providers fail', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Complete offline state'));

    const result = await reverseGeocodeCoordinates(26.8467, 80.9462);

    expect(result.formattedAddress).toContain('Verified GPS Location');
    expect(result.formattedAddress).toContain('26.84670');
    expect(result.formattedAddress).toContain('80.94620');
    expect(result.country).toBe('India');
  });
});

