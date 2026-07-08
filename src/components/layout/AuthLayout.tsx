// ** Packages **
import { Outlet } from 'react-router-dom';

// ** Assets ** (SVG as a React component via vite-plugin-svgr)
import Logo from '@/assets/icons/logo.svg?react';

/**
 * Shell for UNAUTHENTICATED pages (login, register, forgot-password).
 * Centered card on a plain background.
 */
const AuthLayout = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center text-brand-600">
          <Logo />
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
