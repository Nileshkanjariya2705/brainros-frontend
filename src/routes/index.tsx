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
const RegisterPage = lazyRoute(() => import('@/modules/Auth/pages/RegisterPage'));
const DashboardPage = lazyRoute(() => import('@/modules/Dashboard/pages/DashboardPage'));
const AvailableExamsPage = lazyRoute(() => import('@/modules/Exams/pages/AvailableExamsPage'));
const ExamInterfacePage = lazyRoute(() => import('@/modules/Exams/pages/ExamInterfacePage'));
const ExamResultPage = lazyRoute(() => import('@/modules/Exams/pages/ExamResultPage'));
const HistoryPage = lazyRoute(() => import('@/modules/Exams/pages/HistoryPage'));
const NotFoundPage = lazyRoute(() => import('@/components/feedback/NotFoundPage'));

// ** Public (unauthenticated-only) **
const publicRoutes: RouteObject[] = [
  { path: PUBLIC_NAVIGATION.login, element: <LoginPage /> },
  { path: PUBLIC_NAVIGATION.register, element: <RegisterPage /> },
];

// ** Protected inside standard AppLayout (with sidebar + top nav) **
const protectedStandardRoutes: RouteObject[] = [
  { path: PRIVATE_NAVIGATION.dashboard, element: <DashboardPage /> },
  { path: PRIVATE_NAVIGATION.availableExams, element: <AvailableExamsPage /> },
  { path: PRIVATE_NAVIGATION.examResult, element: <ExamResultPage /> },
  { path: PRIVATE_NAVIGATION.myHistory, element: <HistoryPage /> },
];

// ** Protected full-screen routes (distraction-free exam test portal) **
const protectedFullScreenRoutes: RouteObject[] = [
  { path: PRIVATE_NAVIGATION.examInterface, element: <ExamInterfacePage /> },
];

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [{ element: <AuthLayout />, children: publicRoutes }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { element: <AppLayout />, children: protectedStandardRoutes },
      ...protectedFullScreenRoutes,
    ],
  },
  { path: NOT_FOUND_PATH, element: <NotFoundPage /> },
]);

const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default AppRouter;
