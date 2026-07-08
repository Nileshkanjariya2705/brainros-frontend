// ** Packages **
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage for web

// ** Redux **
import rootReducer from './rootReducer';

/**
 * Persist config — whitelist the slices that should survive a refresh.
 * (Repo uses redux-persist with a whitelist; keep auth out if you prefer the
 * token-from-localStorage hydration in authSlice to be the single source.)
 */
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  devTools: import.meta.env.DEV,
  // redux-persist actions aren't serializable — disable that check like the repo.
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

// ** Typed exports (repo convention) **
export type AppDispatchType = typeof store.dispatch;
export const useAppDispatch: () => AppDispatchType = useDispatch;

export type RootStateType = ReturnType<typeof store.getState>;

export const persistor = persistStore(store);
export default store;
