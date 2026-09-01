import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootStateType } from '@/redux/store';
import {
  DEFAULT_FEATURES,
  type FeatureKey,
} from '@/constants/feature-flag.constant';

export interface FeatureState {
  features: Record<FeatureKey, boolean>;
  isLoaded: boolean;
}

const initialState: FeatureState = {
  features: { ...DEFAULT_FEATURES },
  isLoaded: false,
};

const featureSlice = createSlice({
  name: 'features',
  initialState,
  reducers: {
    setFeatures: (
      state,
      action: PayloadAction<Partial<Record<FeatureKey, boolean>>>,
    ) => {
      state.features = {
        ...state.features,
        ...action.payload,
      };
      state.isLoaded = true;
    },
    resetFeatures: (state) => {
      state.features = { ...DEFAULT_FEATURES };
      state.isLoaded = false;
    },
  },
});

export const { setFeatures, resetFeatures } = featureSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────
export const selectFeatures = (state: RootStateType) =>
  state.features?.features || DEFAULT_FEATURES;

export const selectIsFeatureLoaded = (state: RootStateType) =>
  state.features?.isLoaded || false;

export const selectIsFeatureEnabled =
  (featureKey: FeatureKey) => (state: RootStateType): boolean => {
    const flags = state.features?.features;
    if (!flags) return false;
    return Boolean(flags[featureKey]);
  };

export const { reducer } = featureSlice;
export default featureSlice.reducer;
