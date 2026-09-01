import store from '@/redux/store';
import type { FeatureKey } from '@/constants/feature-flag.constant';
import type { PermissionCode } from './permission.constants';

interface CanAccessFeatureParams {
  feature?: FeatureKey;
  permission?: PermissionCode | PermissionCode[];
  requireAllPermissions?: boolean;
}

/**
 * Pure evaluation function combining Feature Flags and RBAC Permissions.
 * Access is granted ONLY when:
 * 1. The feature flag is enabled (if a feature is specified).
 * 2. The user has the required RBAC permission(s) (if permissions are specified).
 */
export const canAccessFeature = ({
  feature,
  permission,
  requireAllPermissions = false,
}: CanAccessFeatureParams): boolean => {
  const state = store.getState();

  // 1. Feature flag evaluation
  if (feature) {
    const isEnabled = Boolean(state.features?.features?.[feature]);
    if (!isEnabled) {
      return false;
    }
  }

  // 2. Permission evaluation
  if (permission) {
    const userPermissions = state.auth?.permissions || [];
    const requiredList = Array.isArray(permission) ? permission : [permission];

    if (requireAllPermissions) {
      const hasAll = requiredList.every((p) => userPermissions.includes(p));
      if (!hasAll) return false;
    } else {
      const hasAny = requiredList.some((p) => userPermissions.includes(p));
      if (!hasAny) return false;
    }
  }

  return true;
};
