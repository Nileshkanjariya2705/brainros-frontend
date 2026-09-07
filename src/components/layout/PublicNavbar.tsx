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
} from 'lucide-react';

// ** Hooks & Constants **
import { useAuth } from '@/hooks/useAuth';
import { PUBLIC_NAVIGATION, PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

export const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isHomePage = location.pathname === PUBLIC_NAVIGATION.home;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <BrainCircuit className="text-white" size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900">BRAINROS</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                MOCK LMS
              </span>
            </div>
            <span className="block text-[10px] text-slate-500 tracking-wider font-medium hidden sm:block">
              Multilingual Exam & Rank Engine
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <Link
            to={isHomePage ? '#test-series' : '/#test-series'}
            className="hover:text-indigo-400 transition-colors"
          >
            Test Series
          </Link>
          <Link
            to={isHomePage ? '#features' : '/#features'}
            className="hover:text-indigo-400 transition-colors"
          >
            Platform Features
          </Link>
          <Link
            to={isHomePage ? '#languages' : '/#languages'}
            className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
          >
            <Languages size={14} className="text-indigo-400" />9 Regional Languages
          </Link>
          <Link
            to={isHomePage ? '#rank-engine' : '/#rank-engine'}
            className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
          >
            <TrendingUp size={14} className="text-purple-400" />
            AI Rank Engine
          </Link>
        </nav>

        {/* Right: Auth Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {isAuthenticated ? (
            <Link
              to={PRIVATE_NAVIGATION.dashboard}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              <GraduationCap size={15} />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to={PUBLIC_NAVIGATION.login}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200"
              >
                <LogIn size={13} />
                <span>Sign In / Student Portal</span>
                <ArrowRight size={13} className="hidden sm:inline" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default PublicNavbar;
