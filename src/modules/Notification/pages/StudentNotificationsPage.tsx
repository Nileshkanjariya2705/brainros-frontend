import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  CheckCheck,
  Clock,
  Zap,
  Award,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import cn from 'classnames';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from '../services/notification.queries';
import { handleNotificationClick } from '../utils/handleNotificationClick';
import type { InAppNotification, NotificationType } from '@/types/exam.types';
import Loader from '@/components/feedback/Loader';

const formatRelativeTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateStr;
  }
};

const getNotificationVisuals = (type: NotificationType) => {
  switch (type) {
    case 'EXAM_SCHEDULED':
      return {
        icon: <Calendar size={18} className="text-indigo-600" />,
        bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        badge: 'Scheduled',
      };
    case 'EXAM_RESCHEDULED':
      return {
        icon: <Clock size={18} className="text-amber-600" />,
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        badge: 'Rescheduled',
      };
    case 'EXAM_CANCELLED':
      return {
        icon: <AlertTriangle size={18} className="text-rose-600" />,
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        badge: 'Cancelled',
      };
    case 'EXAM_STARTING_SOON':
    case 'EXAM_ACTIVATED':
      return {
        icon: <Zap size={18} className="text-emerald-600" />,
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        badge: 'Live Now',
      };
    case 'EXAM_RESULT_PUBLISHED':
    case 'RESULT_AVAILABLE':
      return {
        icon: <Award size={18} className="text-purple-600" />,
        bg: 'bg-purple-50 border-purple-200 text-purple-700',
        badge: 'Results Live',
      };
    default:
      return {
        icon: <Bell size={18} className="text-slate-600" />,
        bg: 'bg-slate-50 border-slate-200 text-slate-700',
        badge: 'Update',
      };
  }
};

export const StudentNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: 15,
      unreadOnly: activeTab === 'UNREAD' ? true : undefined,
    }),
    [currentPage, activeTab],
  );

  const { data: notificationData, isLoading } = useNotificationsQuery(queryParams);
  const notifications: InAppNotification[] = notificationData?.items || [];
  const totalPages = notificationData?.meta?.totalPages || 1;
  const totalCount = notificationData?.meta?.total || 0;

  const { mutateAsync: markReadMutate } = useMarkNotificationReadMutation();
  const { mutateAsync: markAllReadMutate, isPending: isMarkingAll } =
    useMarkAllNotificationsReadMutation();
  const { mutateAsync: deleteMutate } = useDeleteNotificationMutation();

  const handleMarkAsRead = async (id: string) => {
    await markReadMutate(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllReadMutate();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteMutate(id);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
              <Bell size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-indigo-600 text-white text-xs font-black px-2.5 py-0.5 shadow-sm">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Live alerts for exam schedules, live activations, and scorecard publications.
              </p>
            </div>
          </div>

          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll || notifications.every((n) => n.isRead)}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm self-start sm:self-auto',
              notifications.every((n) => n.isRead)
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 border border-indigo-200',
            )}
          >
            <CheckCheck size={16} />
            <span>Mark All as Read</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5">
          <button
            onClick={() => {
              setActiveTab('ALL');
              setCurrentPage(1);
            }}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all',
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
            )}
          >
            All Alerts ({totalCount || notifications.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('UNREAD');
              setCurrentPage(1);
            }}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5',
              activeTab === 'UNREAD'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
            )}
          >
            <span>Unread Only</span>
            {unreadCount > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-black',
                  activeTab === 'UNREAD'
                    ? 'bg-white text-indigo-700'
                    : 'bg-indigo-100 text-indigo-700',
                )}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Notification Feed ─────────────────────────────────────── */}
      {isLoading && notifications.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Loader label="Loading notifications feed..." />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
            <Inbox size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No notifications found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {activeTab === 'UNREAD'
              ? 'You have read all your alerts! Switch to All Alerts to see previous history.'
              : 'You will receive notifications here when exams are scheduled, updated, or published.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => {
            const visuals = getNotificationVisuals(item.type);

            return (
              <div
                key={item.id}
                onClick={() =>
                  handleNotificationClick({
                    notification: item,
                    navigate,
                    onMarkAsRead: handleMarkAsRead,
                  })
                }
                className={cn(
                  'group relative overflow-hidden rounded-3xl border p-5 transition-all duration-200 cursor-pointer hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  !item.isRead
                    ? 'border-indigo-200 bg-indigo-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50/50',
                )}
              >
                {/* Unread Accent Indicator */}
                {!item.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600" />
                )}

                <div className="flex items-start gap-4">
                  {/* Category Icon Badge */}
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-2xl border shrink-0 mt-0.5',
                      visuals.bg,
                    )}
                  >
                    {visuals.icon}
                  </div>

                  {/* Content */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border',
                          visuals.bg,
                        )}
                      >
                        {visuals.badge}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <h4
                      className={cn(
                        'text-sm font-bold leading-tight',
                        !item.isRead ? 'text-slate-950 font-black' : 'text-slate-800',
                      )}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Right Action Trigger */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    <span>View Details</span>
                    <ArrowRight size={14} />
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination Controls ───────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">
            Page <strong className="text-slate-900">{currentPage}</strong> of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentNotificationsPage;
