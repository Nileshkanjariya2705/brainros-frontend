import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Axios } from '@/base-axios';
import { notificationKeys } from '@/services/queryKeys';
import type {
  UnreadCountResponse,
  InAppNotification,
} from '@/types/exam.types';

/**
 * Server-side notification list query.
 */
export const useNotificationsQuery = (
  params: { page?: number; limit?: number; unreadOnly?: boolean } = {},
) =>
  useQuery<{ items: InAppNotification[]; meta: { total: number; totalPages: number } }>({
    queryKey: notificationKeys.list(params),
    queryFn: async () => {
      const res = await Axios.get<any>('/notifications', { params });
      const raw = res.data;
      const items: InAppNotification[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.data?.data)
            ? raw.data.data
            : [];
      const meta = raw?.meta || raw?.data?.meta || {
        total: items.length,
        totalPages: 1,
      };
      return { items, meta };
    },
    staleTime: 30_000,
  });

/**
 * Server-side unread notification count query.
 * Configured with a stable 30-second polling cadence that survives component remounts without burst requests.
 */
export const useUnreadNotificationCountQuery = (enabled = true) =>
  useQuery<number>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const res = await Axios.get<UnreadCountResponse | { data: UnreadCountResponse }>(
        '/notifications/unread-count',
      );
      const data: any = (res.data as any).data || res.data;
      return typeof data?.count === 'number' ? data.count : 0;
    },
    enabled,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

/**
 * Mutation to mark a single notification as read.
 */
export const useMarkNotificationReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await Axios.patch<{ success: boolean; notification: InAppNotification }>(
        `/notifications/${id}/read`,
        {},
      );
      return (res.data as any).data || res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      qc.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
};

/**
 * Mutation to mark all notifications as read.
 */
export const useMarkAllNotificationsReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await Axios.patch<{ success: boolean; updatedCount: number }>(
        '/notifications/read-all',
        {},
      );
      return (res.data as any).data || res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      qc.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
};

/**
 * Mutation to delete a notification.
 */
export const useDeleteNotificationMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await Axios.delete<{ success: boolean }>(`/notifications/${id}`);
      return (res.data as any).data || res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      qc.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
};
