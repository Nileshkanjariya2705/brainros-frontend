// ** Packages **
import { combineReducers } from '@reduxjs/toolkit';

// ** Redux Slices **
import { reducer as authReducer } from './slices/authSlice';

/**
 * Combine every feature slice here, importing each as `{ reducer as xReducer }`
 * (repo convention). Add new slices to this map as the app grows.
 */
const rootReducer = combineReducers({
  auth: authReducer,
  // dashboard: dashboardReducer,
});

export default rootReducer;
