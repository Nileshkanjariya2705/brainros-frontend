import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, ArrowRight } from 'lucide-react';
import {
  useRecentUnreadNotificationQuery,
  useMarkNotificationReadMutation,
} from '../services/notification.queries';
import { handleNotificationClick } from '../utils/handleNotificationClick';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from '@/services/queryKeys';

const formatRelativeTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hr ago`;
    return `${Math.floor(diffSeconds / 86400)} day ago`;
  } catch {
    return 'Recent';
  }
};

export const RecentNotificationPreview: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const { data: notification, isLoading } = useRecentUnreadNotificationQuery();
  const markReadMutation = useMarkNotificationReadMutation();

  if (isLoading || !notification || notification.isRead || dismissedId === notification.id) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const notifId = notification.id;
    // Mark as read on backend and update cache
    markReadMutation.mutate(notifId);
    // Optimistically remove from recent unread cache
    queryClient.setQueryData(notificationKeys.recentUnread(), null);
    setDismissedId(notifId);

    // Route to the relevant entity
    handleNotificationClick({
      notification,
      navigate,
      onMarkAsRead: () => markReadMutation.mutateAsync(notifId),
    });
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedId(notification.id);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-[92vw] sm:max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto"
    >
      <div
        onClick={handleClick}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-indigo-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md transition-all hover:border-indigo-400 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-900/95"
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <Bell size={14} className="animate-bounce" />
            <span>New Notification</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-400">
              {formatRelativeTime(notification.createdAt)}
            </span>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition"
              title="Dismiss preview"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Notification Title & Body */}
        <div className="space-y-0.5 pr-2">
          <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {notification.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>
        </div>

        {/* Bottom micro-action row */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
          <span className="text-[10px] text-slate-400 font-normal">Click to open & mark read</span>
          <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>View</span>
            <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
};
