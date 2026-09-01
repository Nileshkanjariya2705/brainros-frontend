// ** Packages **
import { combineReducers } from '@reduxjs/toolkit';

// ** Redux Slices **
import { reducer as authReducer } from './slices/authSlice';
import { reducer as featureReducer } from './slices/featureSlice';

/**
 * Combine every feature slice here, importing each as `{ reducer as xReducer }`
 * (repo convention). Add new slices to this map as the app grows.
 */
const rootReducer = combineReducers({
  auth: authReducer,
  features: featureReducer,
});

export default rootReducer;
