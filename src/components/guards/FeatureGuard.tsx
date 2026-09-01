import React from 'react';
import { useFeature } from '@/modules/Auth/auth-access/useFeature';
import type { FeatureKey } from '@/constants/feature-flag.constant';

interface FeatureGuardProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Declarative component-level feature guard.
 * Renders `children` only if `feature` is enabled in the current environment.
 * Otherwise, renders optional `fallback` (or null).
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback = null,
}) => {
  const isEnabled = useFeature(feature);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default FeatureGuard;
