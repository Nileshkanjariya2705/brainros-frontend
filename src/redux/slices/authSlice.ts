// ** Redux **
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// ** Utils **
import { tokenStorage } from '@/utils/token';

// ** Types **
import type { RootStateType } from '@/redux/store';
import type { AuthState, LoginResponse, User } from '@/modules/Auth/types/auth.types';

/**
 * Auth slice — global client state. Token is hydrated from localStorage so a
 * refresh keeps the user signed in. Lives in the central `redux/slices/`
 * directory (one slice file per feature) per repo convention.
 */
const initialState: AuthState = {
  user: null,
  token: tokenStorage.get(),
  isAuthenticated: Boolean(tokenStorage.get()),
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginResponse>) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      tokenStorage.set(token);
    },
    setUserData: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      tokenStorage.clear();
    },
  },
});

// ** Actions **
export const { setCredentials, setUserData, logout } = slice.actions;

// ** Selectors **
export const getCurrentUser = (state: RootStateType) => state.auth.user;
export const getIsAuthenticated = (state: RootStateType) => state.auth.isAuthenticated;
export const getToken = (state: RootStateType) => state.auth.token;

// ** Reducer **
export const reducer = slice.reducer;
export default slice;
