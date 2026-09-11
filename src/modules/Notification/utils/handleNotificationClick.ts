import type { NavigateFunction } from 'react-router-dom';
import type { InAppNotification } from '@/types/exam.types';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

interface NotificationClickHandlerOptions {
  notification: InAppNotification;
  navigate: NavigateFunction;
  onMarkAsRead?: (id: string) => Promise<any> | void;
}

/**
 * Reusable, scalable notification action dispatcher.
 * Decouples structured backend metadata ({ entityType, entityId, action })
 * from client route management.
 */
export const handleNotificationClick = async ({
  notification,
  navigate,
  onMarkAsRead,
}: NotificationClickHandlerOptions) => {
  // 1. Optimistic / Non-blocking Mark-as-read
  if (!notification.isRead && onMarkAsRead) {
    try {
      // Fire-and-forget or fast async without blocking navigation
      Promise.resolve(onMarkAsRead(notification.id)).catch((err) => {
        console.warn('Failed marking notification as read in background', err);
      });
    } catch (err) {
      console.warn('Error initiating mark-as-read', err);
    }
  }

  const { data, type } = notification;

  // 1.5 Direct actionUrl support
  if (data?.actionUrl) {
    navigate(data.actionUrl);
    return;
  }

  const isSuperAdmin = window.location.pathname.startsWith('/super-admin');
  const adminPrefix = isSuperAdmin ? '/super-admin' : '/admin';

  // 2. Resolve target route dynamically from structured metadata
  const entityType = data?.entityType?.toUpperCase();
  const entityId = data?.entityId;

  if (type === 'EXAM_ENDED' || entityType === 'ANSWER_KEY') {
    const targetScheduleId = data?.scheduleId || entityId;
    if (targetScheduleId) {
      navigate(`${adminPrefix}/exam-manager/answer-key/${targetScheduleId}`);
      return;
    }
  }

  if (entityType === 'EXAM_RESULT' && (data?.examId || entityId)) {
    const targetExamId = data?.examId || entityId;
    navigate(`${adminPrefix}/exams/result-processing?examId=${targetExamId}`);
    return;
  }

  if (entityType === 'EXAM' && entityId) {
    navigate(`/student/exams/${entityId}`);
    return;
  }

  if (entityType === 'RESULT' && entityId) {
    navigate(`/exam/result/${entityId}`);
    return;
  }

  if (entityType === 'ATTEMPT') {
    navigate(PRIVATE_NAVIGATION.studentHistory);
    return;
  }

  if (entityType === 'REPORT' || entityType === 'TRENDS') {
    navigate(PRIVATE_NAVIGATION.studentTrends);
    return;
  }

  // 3. Fallback routing based on NotificationType enum
  switch (type) {
    case 'EXAM_SCHEDULED':
    case 'EXAM_RESCHEDULED':
    case 'EXAM_STARTING_SOON':
    case 'EXAM_ACTIVATED':
      if (entityId) {
        navigate(`/student/exams/${entityId}`);
      } else {
        navigate(PRIVATE_NAVIGATION.studentExams);
      }
      break;

    case 'EXAM_RESULT_PUBLISHED':
    case 'RESULT_AVAILABLE':
      if (entityId) {
        navigate(`/exam/result/${entityId}`);
      } else {
        navigate(PRIVATE_NAVIGATION.studentHistory);
      }
      break;

    case 'EXAM_REMINDER':
      navigate(PRIVATE_NAVIGATION.studentCalendar);
      break;

    case 'REPORT_READY':
      navigate(PRIVATE_NAVIGATION.studentTrends);
      break;

    default:
      // Stay on page or route to exams if relevant
      if (entityId) {
        navigate(`/student/exams/${entityId}`);
      }
      break;
  }
};
