import { Link, useLocation } from 'react-router-dom';
import Logo from '@/assets/icons/logo.svg?react';
import { APP_NAME } from '@config';
import { ShieldCheck, UserPlus, LogIn } from 'lucide-react';

const AuthHeader = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <Link to="/login" className="flex items-center space-x-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <Logo className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">{APP_NAME}</span>
              <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/10">
                Student Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Online Examination & Assessment System
            </p>
          </div>
        </Link>

        {/* Center: System Status Badge (hidden on small mobile) */}
        <div className="hidden md:flex items-center space-x-2 rounded-full bg-slate-100/80 px-3.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Verified Examination System
          </span>
        </div>

        {/* Right: Auth Navigation Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            to="/login"
            className={`inline-flex items-center justify-center space-x-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
              isLogin
                ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 sm:border-transparent'
            }`}
          >
            <LogIn className="h-4 w-4" />
            <span>Login</span>
          </Link>

          <Link
            to="/register"
            className={`inline-flex items-center justify-center space-x-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
              isRegister
                ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                : 'bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-100'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Sign Up</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;
