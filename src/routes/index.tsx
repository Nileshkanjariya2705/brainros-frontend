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
const QuestionBankPage = lazyRoute(() => import('@/modules/QuestionBank/pages/QuestionBankPage'));
const CreateQuestionPage = lazyRoute(
  () => import('@/modules/QuestionBank/pages/CreateQuestionPage'),
);
const EditQuestionPage = lazyRoute(() => import('@/modules/QuestionBank/pages/EditQuestionPage'));
const LanguageManagementPage = lazyRoute(
  () => import('@/modules/RegionalLanguage/pages/LanguageManagementPage'),
);
const ExamBlueprintManagementPage = lazyRoute(
  () => import('@/modules/ExamGenerator/pages/ExamBlueprintManagementPage'),
);
const ExamSchedulingManagementPage = lazyRoute(
  () => import('@/modules/ExamScheduling/pages/ExamSchedulingManagementPage'),
);
const StrategyRuleManagementPage = lazyRoute(
  () => import('@/modules/Analysis/pages/StrategyRuleManagementPage'),
);
const AdminLeaderboardPage = lazyRoute(
  () => import('@/modules/Analysis/pages/AdminLeaderboardPage'),
);
const HistoricalDatasetsPage = lazyRoute(
  () => import('@/modules/Analysis/pages/HistoricalDatasetsPage'),
);
const PerformanceTrendsPage = lazyRoute(
  () => import('@/modules/Analysis/pages/PerformanceTrendsPage'),
);
const ParentDashboardPage = lazyRoute(() => import('@/modules/Analysis/pages/ParentDashboardPage'));
const InstitutionDashboardPage = lazyRoute(
  () => import('@/modules/Institution/pages/InstitutionDashboardPage'),
);
const BatchManagementPage = lazyRoute(
  () => import('@/modules/Institution/pages/BatchManagementPage'),
);
const BulkUploadPage = lazyRoute(() => import('@/modules/Institution/pages/BulkUploadPage'));
const ReportsPage = lazyRoute(() => import('@/modules/Institution/pages/ReportsPage'));
const AdminControlCenterPage = lazyRoute(
  () => import('@/modules/Admin/pages/AdminControlCenterPage'),
);
const AdminApprovalQueuePage = lazyRoute(
  () => import('@/modules/Admin/pages/AdminApprovalQueuePage'),
);
const AdminAuditLogsPage = lazyRoute(() => import('@/modules/Admin/pages/AdminAuditLogsPage'));
const AdminNotificationsPage = lazyRoute(
  () => import('@/modules/Admin/pages/AdminNotificationsPage'),
);
const ExamCalendarPage = lazyRoute(() => import('@/modules/ExamScheduling/pages/ExamCalendarPage'));
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
  { path: PRIVATE_NAVIGATION.performanceTrends, element: <PerformanceTrendsPage /> },
  { path: PRIVATE_NAVIGATION.parentDashboard, element: <ParentDashboardPage /> },
  { path: PRIVATE_NAVIGATION.institutionDashboard, element: <InstitutionDashboardPage /> },
  { path: PRIVATE_NAVIGATION.institutionBatches, element: <BatchManagementPage /> },
  { path: PRIVATE_NAVIGATION.institutionBulkUpload, element: <BulkUploadPage /> },
  { path: PRIVATE_NAVIGATION.institutionReports, element: <ReportsPage /> },
  { path: PRIVATE_NAVIGATION.adminControlCenter, element: <AdminControlCenterPage /> },
  { path: PRIVATE_NAVIGATION.adminApprovalQueue, element: <AdminApprovalQueuePage /> },
  { path: PRIVATE_NAVIGATION.adminAuditLogs, element: <AdminAuditLogsPage /> },
  { path: PRIVATE_NAVIGATION.adminNotifications, element: <AdminNotificationsPage /> },
  { path: PRIVATE_NAVIGATION.academicCalendar, element: <ExamCalendarPage /> },
  { path: PRIVATE_NAVIGATION.questionBank, element: <QuestionBankPage /> },
  { path: PRIVATE_NAVIGATION.createQuestion, element: <CreateQuestionPage /> },
  { path: PRIVATE_NAVIGATION.editQuestion, element: <EditQuestionPage /> },
  { path: PRIVATE_NAVIGATION.languages, element: <LanguageManagementPage /> },
  { path: PRIVATE_NAVIGATION.examBlueprints, element: <ExamBlueprintManagementPage /> },
  { path: PRIVATE_NAVIGATION.examScheduling, element: <ExamSchedulingManagementPage /> },
  { path: PRIVATE_NAVIGATION.strategyRules, element: <StrategyRuleManagementPage /> },
  { path: PRIVATE_NAVIGATION.leaderboard, element: <AdminLeaderboardPage /> },
  { path: PRIVATE_NAVIGATION.historicalDatasets, element: <HistoricalDatasetsPage /> },
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
