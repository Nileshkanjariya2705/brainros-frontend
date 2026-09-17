import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2 } from 'lucide-react';
import { Axios } from '@/base-axios';
import { notificationKeys } from '@/services/queryKeys';
import { toast } from '@/utils/toast';

export const StaffNotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // Standard in-app notifications
  const [inAppNotifications, setInAppNotifications] = useState<any[]>([]);
  const [inAppLoading, setInAppLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchInAppNotifications();
  }, []);

  const getArrayData = (response: any): any[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    return [];
  };

  const fetchInAppNotifications = async () => {
    try {
      setInAppLoading(true);
      const res = await Axios.get('/notifications');
      setInAppNotifications(getArrayData(res));
    } catch (err) {
      console.error('Failed to load in-app notifications:', err);
    } finally {
      setInAppLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setIsMarkingAllRead(true);
      await Axios.patch('/notifications/read-all');

      setInAppNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, status: 'READ' }))
      );

      // Immediately zero out topbar bell count badge
      queryClient.setQueryData(notificationKeys.unreadCount(), 0);
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });

      toast.success('All notifications marked as read');
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
      toast.error(err?.message || 'Failed to mark all as read');
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            My Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View your personal alerts, updates, and messages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllRead}
            disabled={isMarkingAllRead || inAppNotifications.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isMarkingAllRead ? 'Marking...' : 'Mark all as read'}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Recent Notifications</h3>
        
        {inAppLoading ? (
          <div className="p-12 text-center text-slate-400">Loading notifications...</div>
        ) : inAppNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No notifications found.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {inAppNotifications.map((n) => (
              <div key={n.id} className="py-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{n.title || n.type}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                  <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 mt-1" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffNotificationsPage;
