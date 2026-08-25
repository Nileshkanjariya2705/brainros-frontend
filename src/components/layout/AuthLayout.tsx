// ** Packages **
import { Outlet } from 'react-router-dom';

// ** Components **
import AuthHeader from './AuthHeader';

/**
 * Shell for UNAUTHENTICATED pages (login, register, forgot-password).
 * Includes responsive header, subtle ambient background glow, and responsive main container.
 */
const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Background Decorative Gradients & Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div
        className="absolute -top-40 left-1/2 -z-10 -translate-x-1/2 blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#6366f1] to-[#a855f7] opacity-20 sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      {/* Auth Header */}
      <AuthHeader />

      {/* Main Content Viewport */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10">
        <Outlet />
      </main>

      {/* Footer / Copyright notice */}
      <footer className="py-4 text-center text-xs text-slate-400 z-10 border-t border-slate-200/50 bg-white/40">
        &copy; {new Date().getFullYear()} Exam Management System. All rights reserved. Safe & Secure
        Assessment Portal.
      </footer>
    </div>
  );
};

export default AuthLayout;
