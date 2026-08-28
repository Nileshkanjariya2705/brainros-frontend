// ** Packages **
import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router-dom';

// ** Guards & Layouts **
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import PageLoader from '@/components/feedback/PageLoader';
import RouteErrorBoundary from '@/components/feedback/RouteErrorBoundary';

// ** Access Control & Constants **
import { PERMISSIONS, ROLES } from '@/modules/Auth/auth-access';
import {
  PUBLIC_NAVIGATION,
  PRIVATE_NAVIGATION,
  NOT_FOUND_PATH,
} from '@/constants/navigation.constant';

// ** Utils **
import { lazyRoute } from '@/utils/lazyRoute';

// ** Pages (lazy — one chunk each) **
const HomePage = lazyRoute(() => import('@/modules/Home/pages/HomePage'));
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
const StudentProfilePage = lazyRoute(() => import('@/modules/Auth/pages/StudentProfilePage'));
const NotFoundPage = lazyRoute(() => import('@/components/feedback/NotFoundPage'));

// ** Public (unauthenticated-only) **
const publicRoutes: RouteObject[] = [
  { path: PUBLIC_NAVIGATION.login, element: <LoginPage /> },
  { path: PUBLIC_NAVIGATION.register, element: <RegisterPage /> },
];

// ** Protected inside standard AppLayout (with sidebar + top nav) **
const protectedStandardRoutes: RouteObject[] = [
  { path: PRIVATE_NAVIGATION.dashboard, element: <DashboardPage /> },
  { path: PRIVATE_NAVIGATION.profile, element: <StudentProfilePage /> },

  // Student & Academic Tests
  {
    path: PRIVATE_NAVIGATION.availableExams,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.EXAM_VIEW, PERMISSIONS.EXAM_ATTEMPT]}
        roles={[ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <AvailableExamsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.examResult,
    element: (
      <ProtectedRoute permissions={[PERMISSIONS.RESULT_VIEW]}>
        <ExamResultPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.myHistory,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.ATTEMPT_VIEW, PERMISSIONS.RESULT_VIEW]}
        roles={[ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <HistoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.performanceTrends,
    element: (
      <ProtectedRoute permissions={[PERMISSIONS.ANALYSIS_VIEW, PERMISSIONS.TRENDS_VIEW]}>
        <PerformanceTrendsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.academicCalendar,
    element: (
      <ProtectedRoute permissions={[PERMISSIONS.EXAM_VIEW]}>
        <ExamCalendarPage />
      </ProtectedRoute>
    ),
  },

  // Institution & B2B
  {
    path: PRIVATE_NAVIGATION.parentDashboard,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.PARENT_VIEW, PERMISSIONS.STUDENT_VIEW]}
        roles={[ROLES.PARENT, ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <ParentDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.institutionDashboard,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.INSTITUTION_VIEW]}
        roles={[ROLES.INSTITUTION_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SALES_AGENT]}
      >
        <InstitutionDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.institutionBatches,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.BATCH_MANAGE, PERMISSIONS.INSTITUTION_VIEW]}
        roles={[ROLES.INSTITUTION_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <BatchManagementPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.institutionBulkUpload,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.BULK_UPLOAD, PERMISSIONS.INSTITUTION_MANAGE]}
        roles={[ROLES.INSTITUTION_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <BulkUploadPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.institutionReports,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.REPORT_VIEW]}
        roles={[ROLES.INSTITUTION_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SALES_AGENT]}
      >
        <ReportsPage />
      </ProtectedRoute>
    ),
  },

  // Governance & Admin Control Center
  {
    path: PRIVATE_NAVIGATION.adminControlCenter,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.APPROVAL_VIEW, PERMISSIONS.USER_VIEW]}
        roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <AdminControlCenterPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.adminApprovalQueue,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.APPROVAL_VIEW]}
        roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <AdminApprovalQueuePage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.adminAuditLogs,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.AUDIT_VIEW]}
        roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <AdminAuditLogsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.adminNotifications,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.NOTIFICATION_VIEW]}
        roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <AdminNotificationsPage />
      </ProtectedRoute>
    ),
  },

  // Question & Translation Management
  {
    path: PRIVATE_NAVIGATION.questionBank,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.QUESTION_VIEW]}
        roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <QuestionBankPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.createQuestion,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.QUESTION_CREATE]}
        roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <CreateQuestionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.editQuestion,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.QUESTION_UPDATE]}
        roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <EditQuestionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.languages,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.TRANSLATION_VIEW]}
        roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <LanguageManagementPage />
      </ProtectedRoute>
    ),
  },

  // Exam Blueprint & Scheduling Studio
  {
    path: PRIVATE_NAVIGATION.examBlueprints,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW]}
        roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <ExamBlueprintManagementPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.examScheduling,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.EXAM_SCHEDULE, PERMISSIONS.EXAM_VIEW]}
        roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <ExamSchedulingManagementPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.strategyRules,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.STRATEGY_VIEW]}
        roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <StrategyRuleManagementPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.leaderboard,
    element: (
      <ProtectedRoute permissions={[PERMISSIONS.RANK_VIEW]}>
        <AdminLeaderboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PRIVATE_NAVIGATION.historicalDatasets,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.ANALYSIS_VIEW]}
        roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <HistoricalDatasetsPage />
      </ProtectedRoute>
    ),
  },
];

// ** Protected full-screen routes (distraction-free exam test portal) **
const protectedFullScreenRoutes: RouteObject[] = [
  {
    path: PRIVATE_NAVIGATION.examInterface,
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.EXAM_ATTEMPT]}
        roles={[ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <ExamInterfacePage />
      </ProtectedRoute>
    ),
  },
];

const router = createBrowserRouter([
  {
    path: PUBLIC_NAVIGATION.home,
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: <PublicRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [{ element: <AuthLayout />, children: publicRoutes }],
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { element: <AppLayout />, children: protectedStandardRoutes },
      ...protectedFullScreenRoutes,
    ],
  },
  { path: NOT_FOUND_PATH, element: <NotFoundPage />, errorElement: <RouteErrorBoundary /> },
]);

const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default AppRouter;
