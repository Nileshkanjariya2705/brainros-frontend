/**
 * Multi-Tier Fail-Safe Reverse Geocoding Utility
 * 
 * Accurately extracts City, State, District, and Formatted Street/Landmark
 * using BigDataCloud Client API (fast, open, CORS-friendly) as Tier 1,
 * and OpenStreetMap Nominatim (zoom=16) as Tier 2 fallback.
 */

export interface ReverseGeocodeResult {
  formattedAddress: string;
  city: string;
  district?: string;
  state: string;
  country: string;
  postcode?: string;
}

/**
 * Reverse geocode coordinates to human-readable address and regional metadata
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  // Fallback defaults
  const defaultFallback: ReverseGeocodeResult = {
    formattedAddress: `Verified GPS Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
    city: '',
    state: '',
    country: 'India',
  };

  // Tier 1: BigDataCloud Reverse Geocoding Client API (High reliability, fast, zero CORS/rate issues)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(bdcUrl, {
      signal: controller.signal,
      headers: { credentials: 'omit' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || '';
      const state = data.principalSubdivision || '';
      const country = data.countryName || 'India';
      const postcode = data.postcode || '';

      // Find district from administrative levels if available
      let district = '';
      if (Array.isArray(data.localityInfo?.administrative)) {
        const districtItem = data.localityInfo.administrative.find(
          (item: any) =>
            item.description?.toLowerCase().includes('district') ||
            item.adminLevel === 5 ||
            item.adminLevel === 6,
        );
        if (districtItem?.name) {
          district = districtItem.name;
        }
      }

      // Build structured address
      const parts = [
        data.locality && data.locality !== city ? data.locality : null,
        city || null,
        district && district !== city ? district : null,
        state || null,
        postcode || null,
        country || 'India',
      ].filter(Boolean);

      const formattedAddress = parts.join(', ');

      if (city || state) {
        return {
          formattedAddress: formattedAddress || `Verified Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
          city: city || district || '',
          district: district || city || '',
          state: state || '',
          country,
          postcode,
        };
      }
    }
  } catch (bdcErr) {
    // Fall through to Tier 2
    console.debug('BigDataCloud geocode attempt skipped/failed, falling back to OSM:', bdcErr);
  }

  // Tier 2: OpenStreetMap Nominatim with zoom 16 (Neighborhood / Town level)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`;
    const res = await fetch(osmUrl, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb ||
        addr.county ||
        addr.city_district ||
        '';

      const district = addr.state_district || addr.county || addr.district || '';
      const state = addr.state || addr.province || '';
      const country = addr.country || 'India';
      const postcode = addr.postcode || '';

      const formattedAddress = data.display_name || [city, district, state, country].filter(Boolean).join(', ');

      return {
        formattedAddress: formattedAddress || defaultFallback.formattedAddress,
        city: city || district,
        district: district || city,
        state,
        country,
        postcode,
      };
    }
  } catch (osmErr) {
    console.debug('OSM geocode attempt failed:', osmErr);
  }

  return defaultFallback;
}

