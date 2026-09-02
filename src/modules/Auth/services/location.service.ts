import axios from 'axios';

export interface ApiStateItem {
  name: string;
  slug: string;
  districtCount?: number;
  officeCount?: number;
}

export interface ApiDistrictItem {
  name: string;
  slug: string;
  officeCount?: number;
}

export type StateItem = ApiStateItem;
export type DistrictItem = ApiDistrictItem;

export interface ApiStateDetailsResponse {
  name: string;
  slug: string;
  districtCount?: number;
  districts: ApiDistrictItem[];
}

const STATES_API_URL = 'https://aniket-thapa.github.io/india-pincode-api/states.json';
const STATE_DETAILS_API_BASE_URL = 'https://aniket-thapa.github.io/india-pincode-api/states';

/**
 * Fallback list of Indian States & UTs in case of network unavailability.
 */
export const FALLBACK_INDIAN_STATES: { name: string; slug: string }[] = [
  { name: 'Andhra Pradesh', slug: 'andhra-pradesh' },
  { name: 'Arunachal Pradesh', slug: 'arunachal-pradesh' },
  { name: 'Assam', slug: 'assam' },
  { name: 'Bihar', slug: 'bihar' },
  { name: 'Chhattisgarh', slug: 'chhattisgarh' },
  { name: 'Goa', slug: 'goa' },
  { name: 'Gujarat', slug: 'gujarat' },
  { name: 'Haryana', slug: 'haryana' },
  { name: 'Himachal Pradesh', slug: 'himachal-pradesh' },
  { name: 'Jharkhand', slug: 'jharkhand' },
  { name: 'Karnataka', slug: 'karnataka' },
  { name: 'Kerala', slug: 'kerala' },
  { name: 'Madhya Pradesh', slug: 'madhya-pradesh' },
  { name: 'Maharashtra', slug: 'maharashtra' },
  { name: 'Manipur', slug: 'manipur' },
  { name: 'Meghalaya', slug: 'meghalaya' },
  { name: 'Mizoram', slug: 'mizoram' },
  { name: 'Nagaland', slug: 'nagaland' },
  { name: 'Odisha', slug: 'odisha' },
  { name: 'Punjab', slug: 'punjab' },
  { name: 'Rajasthan', slug: 'rajasthan' },
  { name: 'Sikkim', slug: 'sikkim' },
  { name: 'Tamil Nadu', slug: 'tamil-nadu' },
  { name: 'Telangana', slug: 'telangana' },
  { name: 'Tripura', slug: 'tripura' },
  { name: 'Uttar Pradesh', slug: 'uttar-pradesh' },
  { name: 'Uttarakhand', slug: 'uttarakhand' },
  { name: 'West Bengal', slug: 'west-bengal' },
  { name: 'Andaman and Nicobar Islands', slug: 'andaman-and-nicobar-islands' },
  { name: 'Chandigarh', slug: 'chandigarh' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', slug: 'dadra-and-nagar-haveli-and-daman-and-diu' },
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Jammu and Kashmir', slug: 'jammu-and-kashmir' },
  { name: 'Ladakh', slug: 'ladakh' },
  { name: 'Lakshadweep', slug: 'lakshadweep' },
  { name: 'Puducherry', slug: 'puducherry' },
];

/**
 * Format string into Title Case for clean UI display.
 * Handles edge cases like "ANDAMAN AND NICOBAR ISLANDS" -> "Andaman and Nicobar Islands".
 */
export const formatLocationName = (name: string): string => {
  if (!name) return '';
  const lowerMinorWords = new Set(['and', 'of', 'the', 'in', 'on', 'at', 'to', 'for', 'a', 'an']);

  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && lowerMinorWords.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Converts state name to lower-case URL-safe slug format.
 * e.g., "Gujarat" -> "gujarat", "Uttar Pradesh" -> "uttar-pradesh", "Jammu and Kashmir" -> "jammu-and-kashmir".
 */
export const getStateSlug = (stateName: string): string => {
  if (!stateName) return '';
  return stateName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Fetches the complete list of Indian States/UTs from the India Pincode API.
 */
export const fetchAllStatesAPI = async (): Promise<{
  data: ApiStateItem[];
  error: string | null;
}> => {
  try {
    const response = await axios.get<ApiStateItem[]>(STATES_API_URL, {
      timeout: 10000,
    });
    if (Array.isArray(response.data)) {
      return { data: response.data, error: null };
    }
    return { data: FALLBACK_INDIAN_STATES as ApiStateItem[], error: null };
  } catch (err: any) {
    console.warn('Failed to fetch states from API, falling back to local dataset:', err?.message || err);
    return {
      data: FALLBACK_INDIAN_STATES as ApiStateItem[],
      error: 'Could not connect to live states server. Loaded cached state list.',
    };
  }
};

/**
 * Fetches all cities / districts for a given state slug.
 * e.g., slug = 'gujarat', 'uttar-pradesh'.
 */
export const fetchDistrictsByStateSlugAPI = async (
  stateSlug: string,
): Promise<{
  data: ApiDistrictItem[];
  error: string | null;
}> => {
  const cleanSlug = getStateSlug(stateSlug);
  if (!cleanSlug) {
    return { data: [], error: 'Invalid state identifier.' };
  }

  try {
    const url = `${STATE_DETAILS_API_BASE_URL}/${cleanSlug}.json`;
    const response = await axios.get<ApiStateDetailsResponse>(url, {
      timeout: 10000,
    });

    if (response.data && Array.isArray(response.data.districts)) {
      return { data: response.data.districts, error: null };
    }
    return { data: [], error: 'No cities or districts found for the selected state.' };
  } catch (err: any) {
    console.error(`Failed to fetch districts for state slug "${cleanSlug}":`, err?.message || err);
    return {
      data: [],
      error: `Failed to load cities for the selected state. Please retry.`,
    };
  }
};
