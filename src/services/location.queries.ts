import { useQuery } from '@tanstack/react-query';
import { masterKeys } from './queryKeys';
import {
  fetchAllStatesAPI,
  fetchDistrictsByStateSlugAPI,
  type ApiStateItem,
  type ApiDistrictItem,
  FALLBACK_INDIAN_STATES,
} from '@/modules/Auth/services/location.service';

/**
 * Cached TanStack Query hook for Indian States & UTs master list.
 * Master location data is completely static and cached for 1 hour.
 */
export const useStatesQuery = () =>
  useQuery<ApiStateItem[]>({
    queryKey: masterKeys.states(),
    queryFn: async () => {
      const res = await fetchAllStatesAPI();
      return res.data || (FALLBACK_INDIAN_STATES as ApiStateItem[]);
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000,
  });

/**
 * Cached TanStack Query hook for Districts in a given State.
 * Dependent query: automatically disabled until a valid state is selected.
 */
export const useDistrictsQuery = (stateSlugOrName?: string | null) =>
  useQuery<ApiDistrictItem[]>({
    queryKey: masterKeys.districts(stateSlugOrName || ''),
    queryFn: async () => {
      if (!stateSlugOrName) return [];
      const res = await fetchDistrictsByStateSlugAPI(stateSlugOrName);
      return res.data || [];
    },
    enabled: Boolean(stateSlugOrName && stateSlugOrName.trim().length > 0),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000,
  });
