import { Axios } from '@/base-axios';
import store from '@/redux/store';
import { setFeatures } from '@/redux/slices/featureSlice';
import type { FeatureKey } from '@/constants/feature-flag.constant';

export interface FeaturesConfigResponse {
  success: boolean;
  features: Record<FeatureKey, boolean>;
}

/**
 * Fetches the latest feature flag configuration from the backend
 * and synchronizes it with the Redux state.
 */
export const fetchAndSyncFeatureFlags = async (): Promise<Record<FeatureKey, boolean> | null> => {
  try {
    const res = await Axios.get<FeaturesConfigResponse>('/config/features');
    const features = res.data?.features;
    if (features) {
      store.dispatch(setFeatures(features));
      return features;
    }
    return null;
  } catch {
    // If request fails (e.g. offline or starting up), retain default false state
    return null;
  }
};
