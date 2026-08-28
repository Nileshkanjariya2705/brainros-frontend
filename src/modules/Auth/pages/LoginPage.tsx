import LoginForm from '../components/LoginForm';
import { APP_NAME } from '@config';
import { Link, Navigate } from 'react-router-dom';
import { ShieldCheck, Sparkles, ArrowRight, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PageLoader from '@/components/feedback/PageLoader';

const LoginPage = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <PageLoader label="Checking existing session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Badge & Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Unified Student Authentication</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Welcome Back</h1>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Access your exams, performance analytics, and test series on{' '}
          <span className="font-semibold text-slate-200">{APP_NAME}</span>
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-[#121528] p-6 sm:p-8 shadow-2xl shadow-black/60 rounded-2xl border border-white/10 relative overflow-hidden text-slate-100">
        {/* Subtle decorative glow line at top of card */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <LoginForm />
      </div>

      {/* Trust & Security Highlights Grid */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="flex items-center space-x-2.5 rounded-xl bg-white/5 p-3 border border-white/8 backdrop-blur-md">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">Bank-Grade RBAC</p>
            <p className="text-[10px] text-slate-400">Argon2id & Rotated JWTs</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 rounded-xl bg-white/5 p-3 border border-white/8 backdrop-blur-md">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">Session Family</p>
            <p className="text-[10px] text-slate-400">Active Reuse Detection</p>
          </div>
        </div>
      </div>

      {/* Footer Link to Register */}
      <div className="text-center text-sm text-slate-400 pt-1">
        <span>Don't have a student profile? </span>
        <Link
          to="/register"
          className="inline-flex items-center font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-all group"
        >
          <span>Register Profile</span>
          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
