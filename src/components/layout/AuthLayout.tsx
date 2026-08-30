// ** Packages **
import { Outlet } from 'react-router-dom';

// ** Components **
import PublicNavbar from './PublicNavbar';

/**
 * Shell for UNAUTHENTICATED pages (login, register, forgot-password).
 * Includes the unified PublicNavbar, dark ambient background glow, and responsive container.
 */
const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 relative overflow-hidden selection:bg-indigo-200 selection:text-indigo-900">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none -z-10" />

      {/* Unified Modern Public Header */}
      <PublicNavbar />

      {/* Main Content Viewport */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <Outlet />
      </main>

      {/* Footer / Copyright notice */}
      <footer className="py-5 text-center text-xs text-slate-500 z-10 border-t border-slate-200 bg-slate-100">
        &copy; {new Date().getFullYear()} BRAINROS MOCK LMS. All rights reserved. Multilingual
        Examination & Rank Engine.
      </footer>
    </div>
  );
};

export default AuthLayout;
