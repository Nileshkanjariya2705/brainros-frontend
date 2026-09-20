import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import cn from 'classnames';
import {
  Bell,
  Calendar,
  Zap,
  Award,
  AlertTriangle,
  Trash2,
  Inbox,
  ArrowRight,
  Search,
  CheckCheck,
  CheckCircle2,
  RefreshCw,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from '@/modules/Notification/services/notification.queries';
import { handleNotificationClick } from '@/modules/Notification/utils/handleNotificationClick';
import type { InAppNotification, NotificationType } from '@/types/exam.types';
import Skeleton from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';

const formatRelativeTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const getNotificationVisuals = (type: NotificationType | string) => {
  const upperType = (type || '').toString().toUpperCase();

  if (upperType.includes('SCHEDULE') || upperType.includes('CALENDAR')) {
    return {
      icon: <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      badgeText: 'Schedule Alert',
      iconBoxBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900',
    };
  }

  if (upperType.includes('RESULT') || upperType.includes('PUBLISH') || upperType.includes('SCORE') || upperType.includes('RANK')) {
    return {
      icon: <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      badgeBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      badgeText: 'Results & Evaluation',
      iconBoxBg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900',
    };
  }

  if (upperType.includes('START') || upperType.includes('ACTIVAT') || upperType.includes('LIVE')) {
    return {
      icon: <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      badgeText: 'Live Exam',
      iconBoxBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900',
    };
  }

  if (upperType.includes('CANCEL') || upperType.includes('FAIL') || upperType.includes('WARN') || upperType.includes('CRITICAL')) {
    return {
      icon: <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      badgeText: 'Action Notice',
      iconBoxBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900',
    };
  }

  if (upperType.includes('APPROV') || upperType.includes('REVIEW') || upperType.includes('VERIF')) {
    return {
      icon: <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
      badgeBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      badgeText: 'Workflow Review',
      iconBoxBg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-100 dark:border-teal-900',
    };
  }

  return {
    icon: <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    badgeText: 'Staff Alert',
    iconBoxBg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  };
};

export const StaffNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'EXAMS' | 'RESULTS' | 'SYSTEM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit,
      unreadOnly: activeTab === 'UNREAD' ? true : undefined,
    }),
    [currentPage, limit, activeTab],
  );

  const { data: notificationData, isLoading, isFetching, refetch } = useNotificationsQuery(queryParams);
  const rawNotifications: InAppNotification[] = notificationData?.items || [];
  const totalPages = notificationData?.meta?.totalPages || 1;
  const totalCount = notificationData?.meta?.total || 0;

  const { mutateAsync: markReadMutate } = useMarkNotificationReadMutation();
  const { mutateAsync: markAllReadMutate, isPending: isMarkingAll } = useMarkAllNotificationsReadMutation();
  const { mutateAsync: deleteMutate } = useDeleteNotificationMutation();

  const handleMarkAsRead = async (id: string) => {
    try {
      await markReadMutate(id);
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllReadMutate();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteMutate(id);
      toast.success('Notification removed');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  // Client-side filtering for sub-categories and search
  const filteredNotifications = useMemo(() => {
    return rawNotifications.filter((item) => {
      const type = (item.type || '').toUpperCase();
      const title = (item.title || '').toLowerCase();
      const msg = (item.message || '').toLowerCase();

      if (activeTab === 'EXAMS') {
        const isExam =
          type.includes('EXAM') ||
          type.includes('SCHEDULE') ||
          type.includes('START') ||
          type.includes('ACTIVAT') ||
          title.includes('exam') ||
          msg.includes('exam');
        if (!isExam) return false;
      }

      if (activeTab === 'RESULTS') {
        const isResult =
          type.includes('RESULT') ||
          type.includes('PUBLISH') ||
          type.includes('SCORE') ||
          type.includes('RANK') ||
          title.includes('result') ||
          msg.includes('result');
        if (!isResult) return false;
      }

      if (activeTab === 'SYSTEM') {
        const isSystem =
          type.includes('SYSTEM') ||
          type.includes('APPROV') ||
          type.includes('USER') ||
          type.includes('ADMIN');
        if (!isSystem && activeTab === 'SYSTEM') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return title.includes(q) || msg.includes(q) || type.toLowerCase().includes(q);
      }

      return true;
    });
  }, [rawNotifications, activeTab, searchQuery]);

  // Metric counts
  const unreadCount = useMemo(
    () => rawNotifications.filter((n) => !n.isRead).length,
    [rawNotifications],
  );

  const examRelatedCount = useMemo(
    () =>
      rawNotifications.filter((n) => {
        const t = (n.type || '').toUpperCase();
        return t.includes('EXAM') || t.includes('SCHEDULE') || t.includes('ACTIVAT');
      }).length,
    [rawNotifications],
  );

  const resultRelatedCount = useMemo(
    () =>
      rawNotifications.filter((n) => {
        const t = (n.type || '').toUpperCase();
        return t.includes('RESULT') || t.includes('PUBLISH') || t.includes('SCORE');
      }).length,
    [rawNotifications],
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-16">
      {/* ─── Hero Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Staff Communications Hub
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Staff Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 animate-pulse">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Real-time notifications for exam duties, schedule changes, evaluation progress, and staff broadcasts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll || rawNotifications.length === 0 || rawNotifications.every((n) => n.isRead)}
            className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-50"
          >
            <CheckCheck className={cn('w-4 h-4 mr-1.5 text-indigo-600 dark:text-indigo-400', isMarkingAll && 'animate-spin')} />
            {isMarkingAll ? 'Marking...' : 'Mark All Read'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750"
          >
            <RefreshCw className={cn('w-4 h-4 mr-1.5', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── Metric Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Notifications */}
        <div
          onClick={() => {
            setActiveTab('ALL');
            setCurrentPage(1);
          }}
          className={cn(
            'p-5 rounded-2xl border transition-all cursor-pointer shadow-sm',
            activeTab === 'ALL'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Alerts
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {totalCount || rawNotifications.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Overall notification history</span>
          </div>
        </div>

        {/* Unread Alerts */}
        <div
          onClick={() => {
            setActiveTab('UNREAD');
            setCurrentPage(1);
          }}
          className={cn(
            'p-5 rounded-2xl border transition-all cursor-pointer shadow-sm',
            activeTab === 'UNREAD'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Unread
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-700 dark:text-indigo-300">
            {unreadCount}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Pending your review</span>
          </div>
        </div>

        {/* Exam & Schedules */}
        <div
          onClick={() => {
            setActiveTab('EXAMS');
            setCurrentPage(1);
          }}
          className={cn(
            'p-5 rounded-2xl border transition-all cursor-pointer shadow-sm',
            activeTab === 'EXAMS'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Exam Schedules
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {examRelatedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Schedules & live events</span>
          </div>
        </div>

        {/* Results & Evaluation */}
        <div
          onClick={() => {
            setActiveTab('RESULTS');
            setCurrentPage(1);
          }}
          className={cn(
            'p-5 rounded-2xl border transition-all cursor-pointer shadow-sm',
            activeTab === 'RESULTS'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Results & Grading
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
            {resultRelatedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Published evaluations</span>
          </div>
        </div>
      </div>

      {/* ─── Main Notification Card Container ────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Controls Bar: Search + Category Filter Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {(
              [
                { id: 'ALL', label: 'All Alerts' },
                { id: 'UNREAD', label: `Unread (${unreadCount})` },
                { id: 'EXAMS', label: 'Exams & Schedules' },
                { id: 'RESULTS', label: 'Results' },
                { id: 'SYSTEM', label: 'System & Admin' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer',
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Notification Feed List */}
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`skel-${i}`}
                  className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-4 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded-xl shrink-0 self-end sm:self-center" />
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Inbox className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No notifications found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? `No notifications matched "${searchQuery}". Try clearing search keywords.`
                  : activeTab === 'UNREAD'
                  ? 'You are all caught up! There are no unread notifications.'
                  : 'You have no notifications in this category yet. When updates arrive, they will appear here.'}
              </p>
              {searchQuery && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 border-slate-200 dark:border-slate-700 text-xs"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((item) => {
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
                      'group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md',
                      !item.isRead
                        ? 'border-indigo-200 dark:border-indigo-900/80 bg-indigo-50/20 dark:bg-indigo-950/20'
                        : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-800/80',
                    )}
                  >
                    {/* Unread Glowing Accent Ribbon */}
                    {!item.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 dark:bg-indigo-500" />
                    )}

                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Icon Badge */}
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 mt-0.5 shadow-2xs',
                          visuals.iconBoxBg,
                        )}
                      >
                        {visuals.icon}
                      </div>

                      {/* Content */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                              visuals.badgeBg,
                            )}
                          >
                            {visuals.badgeText}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        <h4
                          className={cn(
                            'text-sm leading-snug',
                            !item.isRead
                              ? 'font-black text-slate-900 dark:text-white'
                              : 'font-semibold text-slate-800 dark:text-slate-200',
                          )}
                        >
                          {item.title || item.type}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    {/* Right Interactive Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(item.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Mark Read</span>
                        </button>
                      )}

                      <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform px-2 py-1">
                        <span className="hidden sm:inline">View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Pagination Footer ───────────────────────────────────── */}
        {!isLoading && filteredNotifications.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={totalCount || filteredNotifications.length}
              limit={limit}
              onPageChange={setCurrentPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setCurrentPage(1);
              }}
              limitOptions={[5, 10, 20, 50]}
              isFetching={isFetching}
              itemName="notifications"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffNotificationsPage;

