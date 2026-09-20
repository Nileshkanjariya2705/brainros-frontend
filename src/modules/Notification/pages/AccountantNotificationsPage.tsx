import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  DollarSign,
  AlertTriangle,
  Trash2,
  Inbox,
  Search,
  CheckCircle2,
  CreditCard,
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
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';

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

const getNotificationVisuals = (type: string | NotificationType) => {
  const upperType = (type || '').toString().toUpperCase();

  if (upperType.includes('BILL') || upperType.includes('INVOICE') || upperType.includes('PRICE') || upperType.includes('PAYMENT')) {
    return {
      icon: <DollarSign size={18} className="text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      badge: 'Billing & Invoices',
    };
  }

  if (upperType.includes('APPROV') || upperType.includes('SUCCESS')) {
    return {
      icon: <CheckCircle2 size={18} className="text-indigo-600" />,
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      badge: 'Approval',
    };
  }

  if (upperType.includes('WARN') || upperType.includes('ALERT') || upperType.includes('FAIL') || upperType.includes('CANCEL')) {
    return {
      icon: <AlertTriangle size={18} className="text-rose-600" />,
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      badge: 'Urgent Notice',
    };
  }

  return {
    icon: <Bell size={18} className="text-slate-600" />,
    bg: 'bg-slate-50 border-slate-200 text-slate-700',
    badge: 'System Alert',
  };
};

export const AccountantNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'BILLING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit,
      unreadOnly: activeTab === 'UNREAD' ? true : undefined,
    }),
    [currentPage, limit, activeTab],
  );

  const { data: notificationData, isLoading, isFetching } = useNotificationsQuery(queryParams);
  const rawNotifications: InAppNotification[] = notificationData?.items || [];
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

  // Client-side filtering for search & billing category tab
  const filteredNotifications = useMemo(() => {
    return rawNotifications.filter((item) => {
      if (activeTab === 'BILLING') {
        const t = (item.type || '').toUpperCase();
        const msg = (item.message || '').toUpperCase();
        const title = (item.title || '').toUpperCase();
        const isBilling =
          t.includes('BILL') ||
          t.includes('INVOICE') ||
          t.includes('PRICE') ||
          t.includes('PAYMENT') ||
          msg.includes('BILL') ||
          msg.includes('INVOICE') ||
          title.includes('BILL') ||
          title.includes('INVOICE');
        if (!isBilling) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesMsg = item.message?.toLowerCase().includes(q);
        return matchesTitle || matchesMsg;
      }

      return true;
    });
  }, [rawNotifications, activeTab, searchQuery]);

  const unreadCount = rawNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
              <Bell size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900">Accountant Notifications</h1>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 shadow-sm">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time alerts for billing updates, payment approvals, invoice dispatches, and system messages.
              </p>
            </div>
          </div>

          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll || rawNotifications.every((n) => n.isRead)}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm self-start sm:self-auto',
              rawNotifications.length === 0 || rawNotifications.every((n) => n.isRead)
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 border border-emerald-200',
            )}
          >
            <CheckCheck size={16} />
            <span>Mark All as Read</span>
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 flex-wrap">
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
              All Messages ({totalCount || rawNotifications.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('UNREAD');
                setCurrentPage(1);
              }}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5',
                activeTab === 'UNREAD'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
              )}
            >
              <span>Unread Only</span>
              {unreadCount > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-black',
                    activeTab === 'UNREAD'
                      ? 'bg-white text-emerald-700'
                      : 'bg-emerald-100 text-emerald-700',
                  )}
                >
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('BILLING');
                setCurrentPage(1);
              }}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5',
                activeTab === 'BILLING'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
              )}
            >
              <CreditCard size={14} />
              <span>Billing Alerts</span>
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Notification Feed ─────────────────────────────────────── */}
      {isLoading || isFetching ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`skel-notif-${i}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse"
            >
              <div className="flex items-start gap-4 flex-1">
                <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-xl shrink-0 self-end sm:self-center" />
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
            <Inbox size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No notifications found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `No notifications matching "${searchQuery}". Try clearing your search.`
              : activeTab === 'UNREAD'
              ? 'You have read all your notifications! Switch to All Messages to view history.'
              : 'You will receive notifications here when invoices are generated, pricing updates occur, or bills require action.'}
          </p>
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
                  'group relative overflow-hidden rounded-3xl border p-5 transition-all duration-200 cursor-pointer hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  !item.isRead
                    ? 'border-emerald-200 bg-emerald-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50/50',
                )}
              >
                {/* Unread Indicator */}
                {!item.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-600" />
                )}

                <div className="flex items-start gap-4">
                  {/* Category Icon */}
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-2xl border shrink-0 mt-0.5',
                      visuals.bg,
                    )}
                  >
                    {visuals.icon}
                  </div>

                  {/* Text Content */}
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

                {/* Right Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {!item.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(item.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
                    >
                      <CheckCircle2 size={14} />
                      <span>Mark Read</span>
                    </button>
                  )}

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
      {!isLoading && rawNotifications.length > 0 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={totalCount}
          limit={limit}
          onPageChange={setCurrentPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setCurrentPage(1);
          }}
          limitOptions={[5, 10, 20, 50]}
          isFetching={isFetching}
          itemName="alerts"
        />
      )}
    </div>
  );
};

export default AccountantNotificationsPage;
