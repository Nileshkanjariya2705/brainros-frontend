// ** Packages **
import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, type RouteObject, Navigate } from 'react-router-dom';

// ** Guards & Layouts **
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AuthLayout from '@/components/layout/AuthLayout';
import StudentLayout from '@/components/layouts/StudentLayout';
import AdminLayout from '@/components/layouts/AdminLayout';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import StaffLayout from '@/components/layouts/StaffLayout';
import GeneralManagerLayout from '@/components/layouts/GeneralManagerLayout';
import OperatorLayout from '@/components/layouts/OperatorLayout';
import AccountantLayout from '@/components/layouts/AccountantLayout';
import SalesAgentLayout from '@/components/layouts/SalesAgentLayout';
import ParentLayout from '@/components/layouts/ParentLayout';
import InstitutionLayout from '@/components/layouts/InstitutionLayout';
import PageLoader from '@/components/feedback/PageLoader';
import RouteErrorBoundary from '@/components/feedback/RouteErrorBoundary';

// ** Access Control & Constants **
import { PERMISSIONS, ROLES } from '@/modules/Auth/auth-access';
import { FEATURES } from '@/constants/feature-flag.constant';
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

// Role Dashboards
const StudentDashboardPage = lazyRoute(
  () => import('@/modules/Dashboard/pages/StudentDashboardPage'),
);
const AdminDashboardPage = lazyRoute(() => import('@/modules/Dashboard/pages/AdminDashboardPage'));
const SuperAdminDashboardPage = lazyRoute(
  () => import('@/modules/Dashboard/pages/SuperAdminDashboardPage'),
);
const StaffDashboardPage = lazyRoute(
  () => import('@/modules/Dashboard/pages/StaffDashboardPage'),
);
const StaffManagementPage = lazyRoute(
  () => import('@/modules/Admin/pages/StaffManagementPage'),
);
const SuperAdminBillingPage = lazyRoute(
  () => import('@/modules/Billing/pages/SuperAdminBillingPage'),
);
const SuperAdminRegistrationsPage = lazyRoute(
  () => import('@/modules/Admin/pages/SuperAdminRegistrationsPage'),
);
const ParentDashboardLandingPage = lazyRoute(
  () => import('@/modules/Dashboard/pages/ParentDashboardLandingPage'),
);
const DashboardDispatcher = lazyRoute(() => import('@/modules/Dashboard/pages/DashboardPage'));

// Core Shared / Role Pages
const AvailableExamsPage = lazyRoute(() => import('@/modules/Exams/pages/AvailableExamsPage'));
const StudentMockTestsPage = lazyRoute(() => import('@/modules/Exams/pages/StudentMockTestsPage'));
const ExamInterfacePage = lazyRoute(() => import('@/modules/Exams/pages/ExamInterfacePage'));
const ExamResultPage = lazyRoute(() => import('@/modules/Exams/pages/ExamResultPage'));
const HistoryPage = lazyRoute(() => import('@/modules/Exams/pages/HistoryPage'));
const MockHistoryPage = lazyRoute(() => import('@/modules/Exams/pages/MockHistoryPage'));
const QuestionBankPage = lazyRoute(() => import('@/modules/QuestionBank/pages/QuestionBankPage'));
const ChapterManagementPage = lazyRoute(
  () => import('@/modules/Admin/pages/ChapterManagementPage'),
);
const CreateQuestionPage = lazyRoute(
  () => import('@/modules/QuestionBank/pages/CreateQuestionPage'),
);
const EditQuestionPage = lazyRoute(() => import('@/modules/QuestionBank/pages/EditQuestionPage'));
const ImportQuestionsPage = lazyRoute(
  () => import('@/modules/QuestionBank/pages/ImportQuestionsPage'),
);
const LanguageManagementPage = lazyRoute(
  () => import('@/modules/RegionalLanguage/pages/LanguageManagementPage'),
);
const AdminTranslationManagementPage = lazyRoute(
  () => import('@/modules/RegionalLanguage/pages/AdminTranslationManagementPage'),
);
const ImportTranslationsPage = lazyRoute(
  () => import('@/modules/RegionalLanguage/pages/ImportTranslationsPage'),
);
const ExamBlueprintManagementPage = lazyRoute(
  () => import('@/modules/ExamGenerator/pages/ExamBlueprintManagementPage'),
);
const AutoGenerateExamPage = lazyRoute(
  () => import('@/modules/ExamGenerator/pages/AutoGenerateExamPage'),
);
const ExamSchedulingManagementPage = lazyRoute(
  () => import('@/modules/ExamScheduling/pages/ExamSchedulingManagementPage'),
);
const ExamManagementPage = lazyRoute(
  () => import('@/modules/ExamScheduling/pages/ExamManagementPage'),
);
const ExamManagerDashboardPage = lazyRoute(
  () => import('@/modules/ExamManager/pages/ExamManagerDashboardPage'),
);
const DedicatedExamManagementDashboardPage = lazyRoute(
  () => import('@/modules/ExamManager/pages/ExamManagementDashboardPage'),
);
const TranslationManagerPage = lazyRoute(
  () => import('@/modules/RegionalLanguage/pages/TranslationManagerPage'),
);
const UploadQuestionPaperPage = lazyRoute(
  () => import('@/modules/ExamManager/pages/UploadQuestionPaperPage'),
);
const UploadExamQuestionPaperPage = lazyRoute(
  () => import('@/modules/ExamManager/pages/UploadExamQuestionPaperPage'),
);
const ViewQuestionPaperPage = lazyRoute(
  () => import('@/modules/ExamManager/pages/ViewQuestionPaperPage'),
);
const ViewAnswerKeyPage = lazyRoute(
  () => import('@/modules/ExamManager/pages/ViewAnswerKeyPage'),
);
const AnswerKeyManagementPage = lazyRoute(
  () => import('@/modules/ExamManager/pages/AnswerKeyManagementPage'),
);
const ImportHistoryPage = lazyRoute(
  () => import('@/modules/ExamManager/pages/ImportHistoryPage'),
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
const InstitutionStudentsPage = lazyRoute(
  () => import('@/modules/Institution/pages/InstitutionStudentsPage'),
);
const InstitutionRankListPage = lazyRoute(
  () => import('@/modules/Institution/pages/InstitutionRankListPage'),
);
const BatchManagementPage = lazyRoute(
  () => import('@/modules/Institution/pages/BatchManagementPage'),
);
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
const StudentNotificationsPage = lazyRoute(
  () => import('@/modules/Notification/pages/StudentNotificationsPage'),
);
const StudentExamDetailsPage = lazyRoute(
  () => import('@/modules/Exams/pages/StudentExamDetailsPage'),
);
const StudentComparisonPage = lazyRoute(
  () => import('@/modules/Analysis/pages/StudentComparisonPage'),
);
const SuperAdminExamResultsPage = lazyRoute(
  () => import('@/modules/Admin/pages/SuperAdminExamResultsPage'),
);
const SuperAdminExamProcessingMonitorPage = lazyRoute(
  () => import('@/modules/Admin/pages/SuperAdminExamProcessingMonitorPage'),
);
const SuperAdminBulkStudentRegistrationPage = lazyRoute(
  () => import('@/modules/Admin/pages/SuperAdminBulkStudentRegistrationPage'),
);
const CompletedExamReportsPage = lazyRoute(
  () => import('@/modules/Admin/pages/CompletedExamReportsPage'),
);
const AdminStudentsPage = lazyRoute(() => import('@/modules/Admin/pages/AdminStudentsPage'));
const AdminSchoolsPage = lazyRoute(() => import('@/modules/Admin/pages/AdminSchoolsPage'));
const NotFoundPage = lazyRoute(() => import('@/components/feedback/NotFoundPage'));
const SuperAdminAcademicCalendarPage = lazyRoute(
  () => import('@/modules/Admin/pages/SuperAdminAcademicCalendarPage'),
);
const OperatorScheduledExamsPage = lazyRoute(
  () => import('@/modules/ExamManager/pages/OperatorScheduledExamsPage'),
);


// ══════════════════════════════════════════════════════════════════════════
// 1. PUBLIC ROUTES (Unauthenticated Only)
// ══════════════════════════════════════════════════════════════════════════
const publicRoutes: RouteObject[] = [
  { path: PUBLIC_NAVIGATION.login, element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
];

// ══════════════════════════════════════════════════════════════════════════
// 2. STUDENT ROLE DASHBOARD & ROUTES (/student/*)
// ══════════════════════════════════════════════════════════════════════════
const studentRoutes: RouteObject[] = [
  {
    path: '/student',
    element: (
      <ProtectedRoute roles={[ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <StudentDashboardPage /> },
      {
        path: 'exams',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_VIEW, PERMISSIONS.EXAM_ATTEMPT]}>
            <AvailableExamsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mock-tests',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_VIEW, PERMISSIONS.EXAM_ATTEMPT]}>
            <StudentMockTestsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/:examId',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_VIEW]}>
            <StudentExamDetailsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.STUDENT_VIEW]}>
            <StudentNotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'history',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.ATTEMPT_VIEW, PERMISSIONS.RESULT_VIEW]}>
            <HistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mock-history',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.ATTEMPT_VIEW, PERMISSIONS.RESULT_VIEW]}>
            <MockHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mock-tests/history',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.ATTEMPT_VIEW, PERMISSIONS.RESULT_VIEW]}>
            <MockHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exam-calendar',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_VIEW]}>
            <ExamCalendarPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'performance-trends',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.ANALYSIS_VIEW, PERMISSIONS.TRENDS_VIEW]}>
            <PerformanceTrendsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'comparison',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.ANALYSIS_VIEW, PERMISSIONS.TRENDS_VIEW]}>
            <StudentComparisonPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mock-comparison',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.ANALYSIS_VIEW, PERMISSIONS.TRENDS_VIEW]}>
            <StudentComparisonPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leaderboard',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.RANK_VIEW]}>
            <AdminLeaderboardPage />
          </ProtectedRoute>
        ),
      },
      { path: 'profile', element: <StudentProfilePage /> },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 3. ADMIN ROLE DASHBOARD & ROUTES (/admin/*)
// ══════════════════════════════════════════════════════════════════════════
const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.MANAGER]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <AdminDashboardPage /> },
      {
        path: 'question-bank',
        element: (
          <ProtectedRoute
            feature={FEATURES.QUESTION_BANK}
            permissions={[PERMISSIONS.QUESTION_VIEW]}
          >
            <QuestionBankPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'chapters',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.QUESTION_VIEW]}>
            <ChapterManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank/create',
        element: (
          <ProtectedRoute
            feature={FEATURES.ADD_QUESTION}
            permissions={[PERMISSIONS.QUESTION_CREATE]}
          >
            <CreateQuestionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank/import',
        element: (
          <ProtectedRoute
            feature={FEATURES.BULK_IMPORT_QUESTION}
            permissions={[PERMISSIONS.QUESTION_CREATE]}
          >
            <ImportQuestionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank/:id/edit',
        element: (
          <ProtectedRoute
            feature={FEATURES.QUESTION_BANK}
            permissions={[PERMISSIONS.QUESTION_UPDATE]}
          >
            <EditQuestionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'languages',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.TRANSLATION_VIEW]}>
            <LanguageManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'translations',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.TRANSLATION_VIEW]}>
            <AdminTranslationManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'languages/translations',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.TRANSLATION_VIEW]}>
            <AdminTranslationManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'languages/import',
        element: (
          <ProtectedRoute
            feature={FEATURES.BULK_IMPORT_TRANSLATION}
            permissions={[PERMISSIONS.TRANSLATION_CREATE]}
          >
            <ImportTranslationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exam-blueprints',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW]}>
            <ExamBlueprintManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/generate',
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'exam-scheduling',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_SCHEDULE, PERMISSIONS.EXAM_VIEW]}>
            <ExamSchedulingManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mock-tests',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW]}>
            <ExamManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW]}>
            <ExamManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/results',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.RESULT_VIEW]}>
            <SuperAdminExamResultsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/result-processing',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.RESULT_VIEW]}>
            <SuperAdminExamProcessingMonitorPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'completed-exams',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.RESULT_VIEW]}>
            <CompletedExamReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exam-manager',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW]}>
            <ExamManagerDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/:examId/manage',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW]}>
            <DedicatedExamManagementDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'translation-manager/:examId',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.TRANSLATION_VIEW, PERMISSIONS.EXAM_VIEW]}>
            <TranslationManagerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exam-manager/upload',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_CREATE]}>
            <UploadQuestionPaperPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/:examId/question-paper/upload',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_CREATE]}>
            <UploadExamQuestionPaperPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/:examId/question-paper/view',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_VIEW]}>
            <ViewQuestionPaperPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/:scheduleId/answer-key/view',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_VIEW]}>
            <ViewAnswerKeyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exam-manager/answer-key/:scheduleId/view',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_VIEW]}>
            <ViewAnswerKeyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exam-manager/answer-key',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW]}>
            <AnswerKeyManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exam-manager/answer-key/:scheduleId',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW]}>
            <AnswerKeyManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exam-manager/history',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.EXAM_VIEW]}>
            <ImportHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'strategy-rules',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.STRATEGY_VIEW]}>
            <StrategyRuleManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leaderboard',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.RANK_VIEW]}>
            <AdminLeaderboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'historical-datasets',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.ANALYSIS_VIEW]}>
            <HistoricalDatasetsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'control-center',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.USER_VIEW]}>
            <AdminControlCenterPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.AUDIT_VIEW]}>
            <AdminAuditLogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit-logs-page',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.AUDIT_VIEW]}>
            <AdminAuditLogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.NOTIFICATION_VIEW]}>
            <AdminNotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications-page',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.NOTIFICATION_VIEW]}>
            <AdminNotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.USER_VIEW]}>
            <AdminStudentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students/bulk-register',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.USER_VIEW]}>
            <SuperAdminBulkStudentRegistrationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'schools',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.USER_VIEW]}>
            <AdminSchoolsPage />
          </ProtectedRoute>
        ),
      },
      { path: 'profile', element: <StudentProfilePage /> },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 4. SUPER ADMIN ROLE DASHBOARD & ROUTES (/super-admin/*)
// ══════════════════════════════════════════════════════════════════════════
const superAdminRoutes: RouteObject[] = [
  {
    path: '/super-admin',
    element: (
      <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
        <SuperAdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <SuperAdminDashboardPage /> },
      { path: 'registrations', element: <SuperAdminRegistrationsPage /> },
      {
        path: 'question-bank',
        element: (
          <ProtectedRoute feature={FEATURES.QUESTION_BANK}>
            <QuestionBankPage />
          </ProtectedRoute>
        ),
      },
      { path: 'chapters', element: <ChapterManagementPage /> },
      {
        path: 'question-bank/create',
        element: (
          <ProtectedRoute feature={FEATURES.ADD_QUESTION}>
            <CreateQuestionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank/import',
        element: (
          <ProtectedRoute feature={FEATURES.BULK_IMPORT_QUESTION}>
            <ImportQuestionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'question-bank/:id/edit',
        element: (
          <ProtectedRoute feature={FEATURES.QUESTION_BANK}>
            <EditQuestionPage />
          </ProtectedRoute>
        ),
      },
      { path: 'languages', element: <LanguageManagementPage /> },
      { path: 'translations', element: <AdminTranslationManagementPage /> },
      { path: 'languages/translations', element: <AdminTranslationManagementPage /> },
      {
        path: 'languages/import',
        element: (
          <ProtectedRoute feature={FEATURES.BULK_IMPORT_TRANSLATION}>
            <ImportTranslationsPage />
          </ProtectedRoute>
        ),
      },
      { path: 'exam-blueprints', element: <ExamBlueprintManagementPage /> },
      { path: 'exams/generate', element: <AutoGenerateExamPage /> },
      { path: 'mock-tests', element: <ExamManagementPage /> },
      { path: 'exams', element: <ExamManagementPage /> },
      { path: 'exams/results', element: <SuperAdminExamResultsPage /> },
      { path: 'exams/result-processing', element: <SuperAdminExamProcessingMonitorPage /> },
      { path: 'completed-exams', element: <CompletedExamReportsPage /> },
      { path: 'exam-manager', element: <ExamManagerDashboardPage /> },
      { path: 'exam-manager/upload', element: <UploadQuestionPaperPage /> },
      { path: 'exams/:examId/question-paper/upload', element: <UploadExamQuestionPaperPage /> },
      { path: 'exams/:examId/question-paper/view', element: <ViewQuestionPaperPage /> },
      { path: 'exams/:scheduleId/answer-key/view', element: <ViewAnswerKeyPage /> },
      { path: 'exam-manager/answer-key/:scheduleId/view', element: <ViewAnswerKeyPage /> },
      { path: 'exam-manager/answer-key', element: <AnswerKeyManagementPage /> },
      { path: 'exam-manager/answer-key/:scheduleId', element: <AnswerKeyManagementPage /> },
      { path: 'exam-manager/history', element: <ImportHistoryPage /> },
      { path: 'exam-scheduling', element: <ExamSchedulingManagementPage /> },
      { path: 'strategy-rules', element: <StrategyRuleManagementPage /> },
      { path: 'leaderboard', element: <AdminLeaderboardPage /> },
      { path: 'historical-datasets', element: <HistoricalDatasetsPage /> },
      { path: 'control-center', element: <AdminControlCenterPage /> },
      { path: 'approvals', element: <AdminApprovalQueuePage /> },
      { path: 'approval-queue', element: <AdminApprovalQueuePage /> },
      { path: 'audit-logs', element: <AdminAuditLogsPage /> },
      { path: 'audit-logs-page', element: <AdminAuditLogsPage /> },
      { path: 'notifications', element: <AdminNotificationsPage /> },
      { path: 'notifications-page', element: <AdminNotificationsPage /> },
      { path: 'students', element: <AdminStudentsPage /> },
      { path: 'students/bulk-register', element: <SuperAdminBulkStudentRegistrationPage /> },
      { path: 'schools', element: <AdminSchoolsPage /> },
      { path: 'staff', element: <StaffManagementPage /> },
      { path: 'billing', element: <SuperAdminBillingPage /> },
      { path: 'academic-calendar', element: <SuperAdminAcademicCalendarPage /> },
      { path: 'profile', element: <StudentProfilePage /> },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 5. GENERAL MANAGER ROLE DASHBOARD & ROUTES (/general-manager/*)
// ══════════════════════════════════════════════════════════════════════════
const generalManagerRoutes: RouteObject[] = [
  {
    path: '/general-manager',
    element: (
      <ProtectedRoute roles={[ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN]}>
        <GeneralManagerLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <StaffDashboardPage /> },
      { path: 'students', element: <AdminStudentsPage /> },
      { path: 'students/bulk-register', element: <SuperAdminBulkStudentRegistrationPage /> },
      { path: 'schools', element: <AdminSchoolsPage /> },
      { path: 'question-bank', element: <QuestionBankPage /> },
      { path: 'chapters', element: <ChapterManagementPage /> },
      { path: 'question-bank/create', element: <CreateQuestionPage /> },
      { path: 'question-bank/import', element: <ImportQuestionsPage /> },
      { path: 'question-bank/:id/edit', element: <EditQuestionPage /> },
      { path: 'languages', element: <LanguageManagementPage /> },
      { path: 'translations', element: <AdminTranslationManagementPage /> },
      { path: 'languages/import', element: <ImportTranslationsPage /> },
      { path: 'exam-blueprints', element: <ExamBlueprintManagementPage /> },
      { path: 'exams', element: <ExamManagementPage /> },
      { path: 'exam-scheduling', element: <ExamSchedulingManagementPage /> },
      { path: 'exam-manager/upload', element: <UploadQuestionPaperPage /> },
      { path: 'exams/:examId/question-paper/upload', element: <UploadExamQuestionPaperPage /> },
      { path: 'exams/:examId/question-paper/view', element: <ViewQuestionPaperPage /> },
      { path: 'exam-manager/answer-key', element: <AnswerKeyManagementPage /> },
      { path: 'exam-manager/answer-key/:scheduleId', element: <AnswerKeyManagementPage /> },
      { path: 'exam-manager/answer-key/:scheduleId/view', element: <ViewAnswerKeyPage /> },
      { path: 'exams/:scheduleId/answer-key/view', element: <ViewAnswerKeyPage /> },
      { path: 'answer-key', element: <AnswerKeyManagementPage /> },
      { path: 'exam-manager/history', element: <ImportHistoryPage /> },
      { path: 'completed-exams', element: <CompletedExamReportsPage /> },
      { path: 'reports', element: <CompletedExamReportsPage /> },
      { path: 'approvals', element: <AdminApprovalQueuePage /> },
      { path: 'billing', element: <SuperAdminBillingPage /> },
      { path: 'strategy-rules', element: <StrategyRuleManagementPage /> },
      { path: 'leaderboard', element: <AdminLeaderboardPage /> },
      { path: 'historical-datasets', element: <HistoricalDatasetsPage /> },
      { path: 'audit-logs', element: <AdminAuditLogsPage /> },
      { path: 'notifications', element: <AdminNotificationsPage /> },
      { path: 'profile', element: <StudentProfilePage /> },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 6. MANAGER ROLE DASHBOARD & ROUTES (/manager/* -> redirects to /admin/dashboard)
// ══════════════════════════════════════════════════════════════════════════
const managerRoutes: RouteObject[] = [
  {
    path: '/manager/*',
    element: <Navigate to="/admin/dashboard" replace />,
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 7. OPERATOR ROLE DASHBOARD & ROUTES (/operator/*)
// ══════════════════════════════════════════════════════════════════════════
const operatorRoutes: RouteObject[] = [
  {
    path: '/operator',
    element: (
      <ProtectedRoute roles={[ROLES.OPERATOR, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN]}>
        <OperatorLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <StaffDashboardPage /> },
      { path: 'students', element: <AdminStudentsPage /> },
      { path: 'students/bulk-register', element: <SuperAdminBulkStudentRegistrationPage /> },
      { path: 'schools', element: <AdminSchoolsPage /> },
      { path: 'question-bank', element: <QuestionBankPage /> },
      { path: 'chapters', element: <ChapterManagementPage /> },
      { path: 'question-bank/create', element: <CreateQuestionPage /> },
      { path: 'question-bank/import', element: <ImportQuestionsPage /> },
      { path: 'question-bank/:id/edit', element: <EditQuestionPage /> },
      { path: 'languages', element: <LanguageManagementPage /> },
      { path: 'translations', element: <AdminTranslationManagementPage /> },
      { path: 'languages/import', element: <ImportTranslationsPage /> },
      { path: 'exam-blueprints', element: <ExamBlueprintManagementPage /> },
      { path: 'exams', element: <ExamManagementPage /> },
      { path: 'exam-scheduling', element: <ExamSchedulingManagementPage /> },
      { path: 'exams/pending-paper', element: <OperatorScheduledExamsPage /> },
      { path: 'exam-manager/upload', element: <UploadQuestionPaperPage /> },
      { path: 'exams/:examId/question-paper/upload', element: <UploadExamQuestionPaperPage /> },
      { path: 'exams/:examId/question-paper/view', element: <ViewQuestionPaperPage /> },
      { path: 'exam-manager/answer-key', element: <AnswerKeyManagementPage /> },
      { path: 'exam-manager/answer-key/:scheduleId', element: <AnswerKeyManagementPage /> },
      { path: 'exam-manager/answer-key/:scheduleId/view', element: <ViewAnswerKeyPage /> },
      { path: 'exams/:scheduleId/answer-key/view', element: <ViewAnswerKeyPage /> },
      { path: 'answer-key', element: <AnswerKeyManagementPage /> },
      { path: 'exam-manager/history', element: <ImportHistoryPage /> },
      { path: 'completed-exams', element: <CompletedExamReportsPage /> },
      { path: 'reports', element: <CompletedExamReportsPage /> },
      { path: 'approvals', element: <AdminApprovalQueuePage /> },
      { path: 'billing', element: <SuperAdminBillingPage /> },
      { path: 'leaderboard', element: <AdminLeaderboardPage /> },
      { path: 'notifications', element: <AdminNotificationsPage /> },
      { path: 'profile', element: <StudentProfilePage /> },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 8. ACCOUNTANT ROLE DASHBOARD & ROUTES (/accountant/*)
// ══════════════════════════════════════════════════════════════════════════
const accountantRoutes: RouteObject[] = [
  {
    path: '/accountant',
    element: (
      <ProtectedRoute roles={[ROLES.ACCOUNTANT, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN]}>
        <AccountantLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <StaffDashboardPage /> },
      { path: 'billing', element: <SuperAdminBillingPage /> },
      { path: 'reports', element: <CompletedExamReportsPage /> },
      { path: 'notifications', element: <AdminNotificationsPage /> },
      { path: 'profile', element: <StudentProfilePage /> },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 9. SALES AGENT ROLE DASHBOARD & ROUTES (/sales-agent/*)
// ══════════════════════════════════════════════════════════════════════════
const salesAgentRoutes: RouteObject[] = [
  {
    path: '/sales-agent',
    element: (
      <ProtectedRoute roles={[ROLES.SALES_AGENT, ROLES.SUPER_ADMIN]}>
        <SalesAgentLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <InstitutionDashboardPage /> },
      { path: 'schools', element: <AdminSchoolsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'notifications', element: <AdminNotificationsPage /> },
      { path: 'profile', element: <StudentProfilePage /> },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 10. STAFF ROLE DASHBOARD & ROUTES (/staff/*)
// ══════════════════════════════════════════════════════════════════════════
const staffRoutes: RouteObject[] = [
  {
    path: '/staff',
    element: (
      <ProtectedRoute
        roles={[
          ROLES.OPERATOR,
          ROLES.MANAGER,
          ROLES.GENERAL_MANAGER,
          ROLES.ACCOUNTANT,
          ROLES.SUPER_ADMIN,
        ]}
      >
        <StaffLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <StaffDashboardPage /> },
      { path: 'approvals', element: <AdminApprovalQueuePage /> },
      { path: 'exams/pending-paper', element: <OperatorScheduledExamsPage /> },
      { path: 'billing', element: <SuperAdminBillingPage /> },
      { path: 'schools', element: <AdminSchoolsPage /> },
      { path: 'students', element: <AdminStudentsPage /> },
      { path: 'students/bulk-register', element: <SuperAdminBulkStudentRegistrationPage /> },
      { path: 'answer-key', element: <AnswerKeyManagementPage /> },
      { path: 'question-bank', element: <QuestionBankPage /> },
      { path: 'translations', element: <AdminTranslationManagementPage /> },
      { path: 'exams', element: <ExamManagementPage /> },
      { path: 'reports', element: <CompletedExamReportsPage /> },
      { path: 'notifications', element: <AdminNotificationsPage /> },
      { path: 'profile', element: <StudentProfilePage /> },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 11. PARENT ROLE DASHBOARD & ROUTES (/parent/*)
// ══════════════════════════════════════════════════════════════════════════
const parentRoutes: RouteObject[] = [
  {
    path: '/parent',
    element: (
      <ProtectedRoute roles={[ROLES.PARENT, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
        <ParentLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <ParentDashboardLandingPage /> },
      {
        path: 'ward-progress',
        element: (
          <ProtectedRoute permissions={[PERMISSIONS.PARENT_VIEW, PERMISSIONS.STUDENT_VIEW]}>
            <ParentDashboardPage />
          </ProtectedRoute>
        ),
      },
      { path: 'profile', element: <StudentProfilePage /> },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 12. INSTITUTION & B2B PORTAL DASHBOARD & ROUTES (/institution/*)
// ══════════════════════════════════════════════════════════════════════════
const institutionRoutes: RouteObject[] = [
  {
    path: '/institution',
    element: (
      <ProtectedRoute
        roles={[ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES_AGENT]}
      >
        <InstitutionLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <InstitutionDashboardPage /> },
      { path: 'students', element: <InstitutionStudentsPage /> },
      { path: 'rank-list', element: <InstitutionRankListPage /> },
      { path: 'batches', element: <BatchManagementPage /> },
      { path: 'bulk-upload', element: <Navigate to="/institution/batches" replace /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'profile', element: <StudentProfilePage /> },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 13. LEGACY / SHARED ROUTES (Backward Compatibility + Direct Links)
// ══════════════════════════════════════════════════════════════════════════
const legacyAndSharedRoutes: RouteObject[] = [
  // Legacy /dashboard -> routes to role-specific dashboard
  { path: PRIVATE_NAVIGATION.dashboard, element: <DashboardDispatcher /> },
  { path: PRIVATE_NAVIGATION.profile, element: <DashboardDispatcher /> },

  // Exam Result
  {
    path: PRIVATE_NAVIGATION.examResult,
    element: (
      <ProtectedRoute permissions={[PERMISSIONS.RESULT_VIEW]}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [{ path: '', element: <ExamResultPage /> }],
  },

  // Legacy fallback redirects
  {
    path: '/notifications',
    element: <Navigate to={PRIVATE_NAVIGATION.studentNotifications} replace />,
  },
  {
    path: '/exams/:examId',
    element: (
      <ProtectedRoute permissions={[PERMISSIONS.EXAM_VIEW]}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [{ path: '', element: <StudentExamDetailsPage /> }],
  },
  { path: '/exams', element: <Navigate to={PRIVATE_NAVIGATION.studentExams} replace /> },
  { path: '/history', element: <Navigate to={PRIVATE_NAVIGATION.studentHistory} replace /> },
  { path: '/mock-history', element: <Navigate to={PRIVATE_NAVIGATION.studentMockHistory} replace /> },
  {
    path: '/performance-trends',
    element: <Navigate to={PRIVATE_NAVIGATION.studentTrends} replace />,
  },
  {
    path: '/comparison',
    element: <Navigate to={PRIVATE_NAVIGATION.studentComparison} replace />,
  },
  {
    path: '/mock-comparison',
    element: <Navigate to={PRIVATE_NAVIGATION.studentComparison} replace />,
  },
  {
    path: '/parent-dashboard',
    element: <Navigate to={PRIVATE_NAVIGATION.parentWardProgress} replace />,
  },
  {
    path: '/question-bank',
    element: <Navigate to={PRIVATE_NAVIGATION.adminQuestionBank} replace />,
  },
  {
    path: '/question-bank/create',
    element: <Navigate to={PRIVATE_NAVIGATION.adminCreateQuestion} replace />,
  },
  {
    path: '/question-bank/import',
    element: <Navigate to={PRIVATE_NAVIGATION.adminImportQuestions} replace />,
  },
  {
    path: '/languages/import',
    element: <Navigate to={PRIVATE_NAVIGATION.adminImportTranslations} replace />,
  },
  {
    path: '/exam-blueprints',
    element: <Navigate to={PRIVATE_NAVIGATION.adminExamBlueprints} replace />,
  },
  {
    path: '/exam-scheduling',
    element: <Navigate to={PRIVATE_NAVIGATION.adminExamScheduling} replace />,
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 14. FULL-SCREEN DISTRACTION-FREE EXAM PORTAL
// ══════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════
// 15. MASTER ROUTER
// ══════════════════════════════════════════════════════════════════════════
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
      ...studentRoutes,
      ...adminRoutes,
      ...superAdminRoutes,
      ...generalManagerRoutes,
      ...managerRoutes,
      ...operatorRoutes,
      ...accountantRoutes,
      ...salesAgentRoutes,
      ...staffRoutes,
      ...parentRoutes,
      ...institutionRoutes,
      ...legacyAndSharedRoutes,
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
