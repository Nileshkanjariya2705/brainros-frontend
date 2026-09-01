import { useAppSelector } from '@/redux/hooks';
import {
  selectFeatures,
  selectIsFeatureEnabled,
  selectIsFeatureLoaded,
} from '@/redux/slices/featureSlice';
import type { FeatureKey } from '@/constants/feature-flag.constant';

/**
 * Hook to check if a single feature is enabled in the current environment.
 */
export const useFeature = (featureKey: FeatureKey): boolean => {
  return useAppSelector(selectIsFeatureEnabled(featureKey));
};

/**
 * Hook to access all feature flags and their loading status.
 */
export const useFeatures = () => {
  const features = useAppSelector(selectFeatures);
  const isLoaded = useAppSelector(selectIsFeatureLoaded);

  const isEnabled = (key: FeatureKey): boolean => {
    return Boolean(features[key]);
  };

  return {
    features,
    isLoaded,
    isEnabled,
  };
};

export default useFeature;
