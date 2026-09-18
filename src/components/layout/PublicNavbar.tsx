// ** Packages **
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BrainCircuit,
  GraduationCap,
  LogIn,
  UserPlus,
  Zap,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';

// ** Hooks & Constants **
import { useAuth } from '@/hooks/useAuth';
import { PUBLIC_NAVIGATION, PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { ENABLE_AUTH_ROUTES } from '@/config';

export const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCurrent = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About Us', path: '/about' },
    { label: 'Features', path: '/features' },
    { label: 'Services', path: '/services' },
    { label: 'Exams / Solutions', path: '/exams' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Contact Us', path: '/contact' },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-xs transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Brand Logo ─────────────────────────────────────────── */}
        <Link
          to="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-2.5 group shrink-0 select-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-400/25 group-hover:scale-105 transition-transform duration-200">
            <BrainCircuit size={20} />
          </div>

          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-slate-900">
                BRAINROS
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 pointer-events-none select-none">
                <Zap size={8} className="text-indigo-600 fill-indigo-400" />
                <span className="text-[9px] font-extrabold tracking-widest text-indigo-600 uppercase leading-none">
                  Exam Engine
                </span>
              </span>
            </div>
            <span className="text-[9px] text-slate-400 tracking-wider font-medium hidden md:block mt-0.5">
              Online Examination &amp; Analytics
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav Links ──────────────────────────────────── */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-semibold text-slate-600">
          {navLinks.map((link) => {
            const active = isCurrent(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative py-1 transition-colors duration-150 hover:text-indigo-600 ${
                  active ? 'text-indigo-600 font-bold' : ''
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Right Actions (CTAs) ───────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
              <Link
                to={PRIVATE_NAVIGATION.dashboard}
                onClick={closeMobileMenu}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white shadow-md shadow-indigo-300/30 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <GraduationCap size={15} className="hidden sm:block" />
                <span>Go to Dashboard</span>
              </Link>
          ) : ENABLE_AUTH_ROUTES ? (
            <div className="flex items-center gap-2">
              {/* Secondary CTA: Sign In */}
              <Link
                to={PUBLIC_NAVIGATION.login}
                onClick={closeMobileMenu}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all"
              >
                <LogIn size={13} className="text-slate-500" />
                <span>Sign In</span>
              </Link>

              {/* Primary CTA: Get Started */}
              <Link
                to={PUBLIC_NAVIGATION.register}
                onClick={closeMobileMenu}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <UserPlus size={13} className="hidden sm:block" />
                <span>Get Started</span>
                <ArrowRight size={12} className="hidden sm:inline" />
              </Link>
            </div>
          ) : null}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden ml-1 inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Navigation Menu Drawer ─────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white/98 backdrop-blur-xl px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const active = isCurrent(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{link.label}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                </Link>
              );
            })}
          </div>

          {/* Mobile Auth CTAs */}
          {!isAuthenticated && ENABLE_AUTH_ROUTES && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to={PUBLIC_NAVIGATION.register}
                onClick={closeMobileMenu}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs shadow-sm hover:from-indigo-500 transition-all"
              >
                <span className="flex items-center gap-2">
                  <UserPlus size={14} />
                  Get Started Free
                </span>
                <ArrowRight size={13} />
              </Link>
              <Link
                to={PUBLIC_NAVIGATION.login}
                onClick={closeMobileMenu}
                className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                <LogIn size={14} className="mr-2" />
                Sign In to Portal
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
