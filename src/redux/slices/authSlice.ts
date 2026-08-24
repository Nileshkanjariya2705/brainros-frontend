// ** Redux **
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// ** Utils **
import { tokenStorage } from '@/utils/token';

// ** Types **
import type { RootStateType } from '@/redux/store';
import type { AuthState, LoginResponse, User } from '@/modules/Auth/types/auth.types';

const initialState: AuthState = {
  user: null,
  token: tokenStorage.get(),
  refreshToken: tokenStorage.getRefreshToken(),
  isAuthenticated: Boolean(tokenStorage.get()),
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginResponse>) => {
      const { accessToken, refreshToken, user } = action.payload;
      state.token = accessToken;
      state.refreshToken = refreshToken;
      state.user = user;
      state.isAuthenticated = true;
      tokenStorage.set(accessToken);
      tokenStorage.setRefreshToken(refreshToken);
    },
    setUserData: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
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
export const getRefreshToken = (state: RootStateType) => state.auth.refreshToken;

// ** Reducer **
export const reducer = slice.reducer;
export default slice;
