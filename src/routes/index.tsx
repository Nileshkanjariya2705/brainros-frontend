// ** Packages **
import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router-dom';

// ** Guards & Layouts **
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import PageLoader from '@/components/feedback/PageLoader';

// ** Utils **
import { lazyRoute } from '@/utils/lazyRoute';

// ** Constants **
import {
  PUBLIC_NAVIGATION,
  PRIVATE_NAVIGATION,
  NOT_FOUND_PATH,
} from '@/constants/navigation.constant';

// ** Pages (lazy — one chunk each) **
const LoginPage = lazyRoute(() => import('@/modules/Auth/pages/LoginPage'));
const DashboardPage = lazyRoute(() => import('@/modules/Dashboard/pages/DashboardPage'));
const NotFoundPage = lazyRoute(() => import('@/components/feedback/NotFoundPage'));

// One central place for every route. Add new pages to the right group.

// ** Public (unauthenticated-only) **
const publicRoutes: RouteObject[] = [{ path: PUBLIC_NAVIGATION.login, element: <LoginPage /> }];

// ** Protected (authenticated-only) **
const protectedRoutes: RouteObject[] = [
  { path: PRIVATE_NAVIGATION.dashboard, element: <DashboardPage /> },
];

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [{ element: <AuthLayout />, children: publicRoutes }],
  },
  {
    element: <ProtectedRoute />,
    children: [{ element: <AppLayout />, children: protectedRoutes }],
  },
  { path: NOT_FOUND_PATH, element: <NotFoundPage /> },
]);

const AppRouter = () => {
  // Single Suspense boundary covers every lazily-loaded page chunk.
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default AppRouter;
