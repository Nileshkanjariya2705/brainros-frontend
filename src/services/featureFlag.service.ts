import { Axios } from '@/base-axios';
import store from '@/redux/store';
import { setFeatures } from '@/redux/slices/featureSlice';
import type { FeatureKey } from '@/constants/feature-flag.constant';

export interface FeaturesConfigResponse {
  success: boolean;
  features: Record<FeatureKey, boolean>;
}

let featuresPromise: Promise<Record<FeatureKey, boolean> | null> | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetches the latest feature flag configuration from the backend
 * and synchronizes it with the Redux state.
 * Deduplicates concurrent calls and caches results for 10 minutes.
 */
export const fetchAndSyncFeatureFlags = async (force = false): Promise<Record<FeatureKey, boolean> | null> => {
  const now = Date.now();
  if (!force && featuresPromise) {
    return featuresPromise;
  }
  if (!force && lastFetchedAt && now - lastFetchedAt < CACHE_TTL_MS) {
    const currentFeatures = store.getState().features?.features;
    if (currentFeatures && Object.keys(currentFeatures).length > 0) {
      return currentFeatures;
    }
  }

  featuresPromise = (async () => {
    try {
      const res = await Axios.get<FeaturesConfigResponse>('/config/features');
      const features = res.data?.features;
      if (features) {
        store.dispatch(setFeatures(features));
        lastFetchedAt = Date.now();
        return features;
      }
      return null;
    } catch {
      // If request fails (e.g. offline or starting up), retain default false state
      return null;
    } finally {
      featuresPromise = null;
    }
  })();

  return featuresPromise;
};
