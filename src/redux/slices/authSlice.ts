// ** Redux **
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// ** Utils **
import { tokenStorage } from '@/utils/token';
import { getHighestPriorityRole, computeEffectivePermissions } from '@/modules/Auth/auth-access';

// ** Types **
import type { RootStateType } from '@/redux/store';
import type { AuthState, LoginResponse, User } from '@/modules/Auth/types/auth.types';

const savedToken = tokenStorage.get();
const savedRefreshToken = tokenStorage.getRefreshToken();

const initialState: AuthState = {
  user: null,
  token: savedToken,
  refreshToken: savedRefreshToken,
  isAuthenticated: Boolean(savedToken),
  isInitializing: !savedToken,
  roles: [],
  permissions: [],
  activeRole: null,
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginResponse>) => {
      const { accessToken, refreshToken, user } = action.payload;
      state.token = accessToken;
      state.refreshToken = refreshToken || state.refreshToken;

      if (user) {
        const roles = user.roles || [];
        const computedPermissions = computeEffectivePermissions(roles, user.permissions || []);
        const activeRole = user.activeRole || getHighestPriorityRole(roles);

        state.user = {
          ...user,
          roles,
          permissions: computedPermissions,
          activeRole,
        };
        state.roles = roles;
        state.permissions = computedPermissions;
        state.activeRole = activeRole;
      }

      state.isAuthenticated = true;
      state.isInitializing = false;

      tokenStorage.set(accessToken);
      if (refreshToken) {
        tokenStorage.setRefreshToken(refreshToken);
      }
    },

    setUserData: (state, action: PayloadAction<Partial<User>>) => {
      const existingUser = state.user || ({} as User);
      const updatedUser = { ...existingUser, ...action.payload };

      const roles = updatedUser.roles || state.roles || [];
      const computedPermissions = computeEffectivePermissions(
        roles,
        updatedUser.permissions || state.permissions || [],
      );
      const activeRole =
        action.payload.activeRole || state.activeRole || getHighestPriorityRole(roles);

      state.user = {
        ...updatedUser,
        roles,
        permissions: computedPermissions,
        activeRole,
      };
      state.roles = roles;
      state.permissions = computedPermissions;
      state.activeRole = activeRole;
    },

    setActiveRole: (state, action: PayloadAction<string>) => {
      const requestedRole = action.payload;
      if (state.roles.includes(requestedRole)) {
        state.activeRole = requestedRole;
        if (state.user) {
          state.user.activeRole = requestedRole;
        }
      }
    },

    setPermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
      if (state.user) {
        state.user.permissions = action.payload;
      }
    },

    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
      state.roles = [];
      state.permissions = [];
      state.activeRole = null;
      tokenStorage.clear();
    },
  },
});

// ** Actions **
export const {
  setCredentials,
  setUserData,
  setActiveRole,
  setPermissions,
  setInitializing,
  logout,
} = slice.actions;

// ** Selectors **
export const getCurrentUser = (state: RootStateType) => state.auth.user;
export const getIsAuthenticated = (state: RootStateType) => state.auth.isAuthenticated;
export const getIsInitializing = (state: RootStateType) => state.auth.isInitializing;
export const getToken = (state: RootStateType) => state.auth.token;
export const getRefreshToken = (state: RootStateType) => state.auth.refreshToken;
export const getUserRoles = (state: RootStateType) => state.auth.roles;
export const getUserPermissions = (state: RootStateType) => state.auth.permissions;
export const getActiveRole = (state: RootStateType) => state.auth.activeRole;

// ** Reducer **
export const reducer = slice.reducer;
export default slice;
