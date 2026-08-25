import LoginForm from '../components/LoginForm';
import { APP_NAME } from '@config';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Zap, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  return (
    <div className="w-full max-w-md space-y-6">
      {/* Top Badge & Heading */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 ring-1 ring-inset ring-brand-500/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Passwordless Authentication</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Access your exams, performance analytics, and test series on{' '}
          <span className="font-semibold text-slate-700">{APP_NAME}</span>
        </p>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-200/80">
        <LoginForm />
      </div>

      {/* Trust Highlights */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="flex items-center space-x-2 rounded-xl bg-white/60 p-2.5 border border-slate-200/60 backdrop-blur-sm">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">Secure Access</p>
            <p className="text-[10px] text-slate-500">256-bit encrypted</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 rounded-xl bg-white/60 p-2.5 border border-slate-200/60 backdrop-blur-sm">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">Instant OTP</p>
            <p className="text-[10px] text-slate-500">Fast sign-in</p>
          </div>
        </div>
      </div>

      {/* Footer Link to Register */}
      <div className="text-center text-sm text-slate-600 pt-2">
        <span>Don't have a student profile? </span>
        <Link
          to="/register"
          className="inline-flex items-center font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-all group"
        >
          <span>Register Profile</span>
          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
