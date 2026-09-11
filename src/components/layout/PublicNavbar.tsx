// ** Packages **
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BrainCircuit,
  Languages,
  TrendingUp,
  ArrowRight,
  GraduationCap,
  LogIn,
  UserPlus,
  Zap,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

// ** Hooks & Constants **
import { useAuth } from '@/hooks/useAuth';
import { PUBLIC_NAVIGATION, PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

export const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === PUBLIC_NAVIGATION.home;
  const isLoginPage = location.pathname === PUBLIC_NAVIGATION.login;
  const isRegisterPage = location.pathname === PUBLIC_NAVIGATION.register;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">

        {/* ── Brand ──────────────────────────────────────────────── */}
        <Link
          to="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-2 sm:gap-2.5 group shrink-0 select-none"
        >
          {/* Logo icon */}
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md shadow-indigo-400/25 group-hover:scale-105 transition-transform duration-200">
            <BrainCircuit className="text-white" size={18} />
          </div>

          {/* Name + badge */}
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-[16px] font-black tracking-tight text-slate-900">
                BRAINROS
              </span>
              {/* MOCK LMS — hidden on ultra-small screens to preserve room for actions */}
              <span className="hidden min-[420px]:inline-flex items-center gap-0.5 rounded-full bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 pointer-events-none select-none">
                <Zap size={8} className="text-indigo-500 fill-indigo-400" />
                <span className="text-[9px] font-extrabold tracking-widest text-indigo-500 uppercase leading-none">
                  Mock LMS
                </span>
              </span>
            </div>
            <span className="text-[9px] text-slate-400 tracking-wider font-medium hidden md:block mt-0.5">
              Multilingual Exam &amp; Rank Engine
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav Links ──────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs font-semibold text-slate-600">
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
            <Languages size={13} className="text-indigo-500" />
            <span>9 Languages</span>
          </Link>
          <Link
            to={isHomePage ? '#rank-engine' : '/#rank-engine'}
            className="hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <TrendingUp size={13} className="text-purple-500" />
            <span>AI Rank</span>
          </Link>
        </nav>

        {/* ── Right Actions (Register & Sign In) ─────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {isAuthenticated ? (
            <Link
              to={PRIVATE_NAVIGATION.dashboard}
              onClick={closeMobileMenu}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white shadow-md shadow-indigo-300/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <GraduationCap size={15} />
              <span>Dashboard</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Registration Button */}
              <Link
                to={PUBLIC_NAVIGATION.register}
                onClick={closeMobileMenu}
                aria-label="Register new student account"
                className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-xl border px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all duration-150 hover:scale-[1.02] active:scale-95 whitespace-nowrap shadow-2xs ${
                  isRegisterPage
                    ? 'border-indigo-400 bg-indigo-100/90 text-indigo-900 ring-2 ring-indigo-400/30'
                    : 'border-indigo-200/80 bg-indigo-50/70 hover:bg-indigo-100/90 text-indigo-700 hover:text-indigo-900'
                }`}
              >
                <UserPlus size={13} className="shrink-0 text-indigo-600" />
                <span>Register</span>
              </Link>

              {/* Sign In Button */}
              <Link
                to={PUBLIC_NAVIGATION.login}
                onClick={closeMobileMenu}
                aria-label="Sign in to your account"
                className={`group inline-flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap ${
                  isLoginPage
                    ? 'bg-gradient-to-r from-indigo-700 to-violet-700 ring-2 ring-indigo-400/50 shadow-indigo-600/30'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25 hover:shadow-indigo-500/40'
                }`}
              >
                <LogIn size={13} className="shrink-0" />
                <span>Sign In</span>
                <span className="hidden lg:inline text-indigo-300 font-light mx-0.5">/</span>
                <span className="hidden lg:inline font-medium text-indigo-100">Student Portal</span>
                <ArrowRight
                  size={12}
                  className="shrink-0 opacity-70 group-hover:translate-x-0.5 transition-transform duration-150 hidden sm:inline"
                />
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle (only on md and below) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden ml-1 inline-flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </div>

      {/* ── Mobile Navigation Dropdown ────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/98 backdrop-blur-xl px-4 pt-3 pb-5 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-600">
            <Link
              to={isHomePage ? '#test-series' : '/#test-series'}
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-lg hover:bg-indigo-50/70 hover:text-indigo-600 transition-colors"
            >
              Test Series
            </Link>
            <Link
              to={isHomePage ? '#features' : '/#features'}
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-lg hover:bg-indigo-50/70 hover:text-indigo-600 transition-colors"
            >
              Features
            </Link>
            <Link
              to={isHomePage ? '#languages' : '/#languages'}
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-lg hover:bg-indigo-50/70 hover:text-indigo-600 transition-colors flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Languages size={15} className="text-indigo-500" />
                9 Languages
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                Official NTA
              </span>
            </Link>
            <Link
              to={isHomePage ? '#rank-engine' : '/#rank-engine'}
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-lg hover:bg-purple-50/70 hover:text-purple-600 transition-colors flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <TrendingUp size={15} className="text-purple-500" />
                AI Rank Engine
              </span>
              <span className="text-[10px] bg-purple-50 text-purple-600 font-bold px-2 py-0.5 rounded-full border border-purple-100">
                Live Percentiles
              </span>
            </Link>

            {/* Mobile Action Cards (when unauthenticated) */}
            {!isAuthenticated && (
              <div className="pt-3 mt-2 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  to={PUBLIC_NAVIGATION.register}
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-800 font-bold text-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus size={15} className="text-indigo-600" />
                    Create Student Account
                  </span>
                  <Sparkles size={13} className="text-indigo-500" />
                </Link>

                <Link
                  to={PUBLIC_NAVIGATION.login}
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs shadow-sm hover:from-indigo-500 hover:to-violet-500 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <LogIn size={15} />
                    Sign In to Portal
                  </span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
