// ** Packages **
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BrainCircuit,
  Languages,
  TrendingUp,
  ArrowRight,
  GraduationCap,
  LogIn,
  Zap,
} from 'lucide-react';

// ** Hooks & Constants **
import { useAuth } from '@/hooks/useAuth';
import { PUBLIC_NAVIGATION, PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

export const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isHomePage = location.pathname === PUBLIC_NAVIGATION.home;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ── Brand ──────────────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          {/* Logo icon */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md shadow-indigo-400/25 group-hover:scale-105 transition-transform duration-200">
            <BrainCircuit className="text-white" size={19} />
          </div>

          {/* Name + badge */}
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[16px] font-black tracking-tight text-slate-900">BRAINROS</span>
              {/* MOCK LMS — subtle read-only pill, not clickable */}
              <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 pointer-events-none select-none">
                <Zap size={8} className="text-indigo-500 fill-indigo-400" />
                <span className="text-[9px] font-extrabold tracking-widest text-indigo-500 uppercase leading-none">
                  Mock LMS
                </span>
              </span>
            </div>
            <span className="text-[9px] text-slate-400 tracking-wider font-medium hidden sm:block mt-0.5">
              Multilingual Exam &amp; Rank Engine
            </span>
          </div>
        </Link>

        {/* ── Nav Links ──────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-6 text-[11px] font-semibold text-slate-500">
          <Link
            to={isHomePage ? '#test-series' : '/#test-series'}
            className="hover:text-indigo-600 transition-colors"
          >
            Test Series
          </Link>
          <Link
            to={isHomePage ? '#features' : '/#features'}
            className="hover:text-indigo-600 transition-colors"
          >
            Features
          </Link>
          <Link
            to={isHomePage ? '#languages' : '/#languages'}
            className="hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <Languages size={12} className="text-indigo-400" />
            9 Languages
          </Link>
          <Link
            to={isHomePage ? '#rank-engine' : '/#rank-engine'}
            className="hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <TrendingUp size={12} className="text-purple-500" />
            AI Rank
          </Link>
        </nav>

        {/* ── CTA Button ─────────────────────────────────────────── */}
        <div className="shrink-0">
          {isAuthenticated ? (
            <Link
              to={PRIVATE_NAVIGATION.dashboard}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-300/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <GraduationCap size={14} />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              to={PUBLIC_NAVIGATION.login}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-2.5 text-[11px] font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
            >
              <LogIn size={13} className="shrink-0" />
              <span>Sign In</span>
              <span className="hidden sm:inline text-indigo-300 font-light mx-0.5">/</span>
              <span className="hidden sm:inline">Student Portal</span>
              <ArrowRight
                size={12}
                className="shrink-0 opacity-70 group-hover:translate-x-0.5 transition-transform duration-150"
              />
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};

export default PublicNavbar;
