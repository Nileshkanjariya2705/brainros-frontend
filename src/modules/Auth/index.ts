/** Public surface of the Auth module — import from here, not deep paths. */
export { default as LoginPage } from './pages/LoginPage';
export { default as RegisterPage } from './pages/RegisterPage';
export { default as LoginForm } from './components/LoginForm';
export { default as ActiveSessionsModal } from './components/ActiveSessionsModal';
export { default as StudentProfileModal } from './components/StudentProfileModal';

// Hooks
export { useSendOtp } from './hooks/useSendOtp';
export { useVerifyOtp } from './hooks/useVerifyOtp';
export { useLoginEmail } from './hooks/useLoginEmail';
export { useLoginStudentId } from './hooks/useLoginStudentId';
export { useLoginGoogle } from './hooks/useLoginGoogle';
export { useRegisterStudent } from './hooks/useRegisterStudent';
export { useSessions } from './hooks/useSessions';
export { useStudentProfile } from './hooks/useStudentProfile';

// Services & Types
export * from './services';
export * from './types/auth.types';
