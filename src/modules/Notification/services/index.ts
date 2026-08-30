import { useCallback } from 'react';
import { useAxiosGet, useAxiosPatch, useAxiosDelete } from '@/hooks/useAxios';
import type {
  NotificationListResponse,
  UnreadCountResponse,
  InAppNotification,
} from '@/types/exam.types';

export const useGetNotificationsAPI = () => {
  const [get, state] = useAxiosGet();
  const getNotificationsAPI = useCallback(
    (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
      get<NotificationListResponse>('/notifications', { params }),
    [get],
  );
  return { getNotificationsAPI, ...state };
};

export const useGetUnreadCountAPI = () => {
  const [get, state] = useAxiosGet();
  const getUnreadCountAPI = useCallback(
    () => get<UnreadCountResponse>('/notifications/unread-count'),
    [get],
  );
  return { getUnreadCountAPI, ...state };
};

export const useMarkNotificationAsReadAPI = () => {
  const [patch, state] = useAxiosPatch();
  const markNotificationAsReadAPI = useCallback(
    (id: string) =>
      patch<{ success: boolean; notification: InAppNotification }>(`/notifications/${id}/read`, {}),
    [patch],
  );
  return { markNotificationAsReadAPI, ...state };
};

export const useMarkAllNotificationsAsReadAPI = () => {
  const [patch, state] = useAxiosPatch();
  const markAllNotificationsAsReadAPI = useCallback(
    () => patch<{ success: boolean; updatedCount: number }>('/notifications/read-all', {}),
    [patch],
  );
  return { markAllNotificationsAsReadAPI, ...state };
};

export const useDeleteNotificationAPI = () => {
  const [del, state] = useAxiosDelete();
  const deleteNotificationAPI = useCallback(
    (id: string) => del<{ success: boolean }>(`/notifications/${id}`),
    [del],
  );
  return { deleteNotificationAPI, ...state };
};
