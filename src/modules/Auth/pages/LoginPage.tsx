import LoginForm from '../components/LoginForm';
import { APP_NAME } from '@config';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, GraduationCap, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PageLoader from '@/components/feedback/PageLoader';

export const LoginPage = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <PageLoader label="Checking existing session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/80 shadow-2xs">
          <GraduationCap className="h-4 w-4 text-indigo-600" />
          <span>Unified Examination Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Welcome to {APP_NAME}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-medium">
          Sign in using your registered mobile number or Student ID
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white p-4 min-[360px]:p-6 sm:p-8 shadow-sm rounded-2xl min-[360px]:rounded-3xl border border-slate-200/80 relative overflow-hidden text-slate-900">
        <LoginForm />
      </div>

      {/* Trust & Security Highlights Grid */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
        <div className="flex items-center space-x-2.5 rounded-2xl bg-white p-3.5 border border-slate-200/80 shadow-2xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900">Encrypted Auth</p>
            <p className="text-[10px] text-slate-400 font-semibold">Argon2id & JWTs</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 rounded-2xl bg-white p-3.5 border border-slate-200/80 shadow-2xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900">Secure Sessions</p>
            <p className="text-[10px] text-slate-400 font-semibold">Active Token Rotation</p>
          </div>
        </div>
      </div>

      {/* B2B School Enrolled Candidate Note */}
      <div className="text-center text-xs text-slate-500 pt-1 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200/60">
        <span>Enrolled via your school or institution? Contact your school coordinator if you need help with your credentials.</span>
      </div>
    </div>
  );
};

export default LoginPage;
