/** Public surface of the Auth module — import from here, not deep paths. */
export { default as LoginPage } from './pages/LoginPage';
export { default as RegisterPage } from './pages/RegisterPage';
export { default as LoginForm } from './components/LoginForm';
export { useSendOtp } from './hooks/useSendOtp';
export { useVerifyOtp } from './hooks/useVerifyOtp';
export { useRegisterStudent } from './hooks/useRegisterStudent';
export * from './services';
export * from './types/auth.types';
