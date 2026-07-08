/** Public surface of the Auth module — import from here, not deep paths. */
export { default as LoginPage } from './pages/LoginPage';
export { default as LoginForm } from './components/LoginForm';
export { useLogin } from './hooks/useLogin';
export { useLoginAPI, useGetProfileAPI, useLogoutAPI } from './services';
export type { User, LoginCredentials, LoginResponse, AuthState } from './types/auth.types';
