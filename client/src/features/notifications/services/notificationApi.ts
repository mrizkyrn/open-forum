import { apiClient } from '@/shared/services/client';
import { ApiResponse, PaginatedResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import {
  MarkNotificationsReadRequest,
  Notification,
  NotificationCountResponse,
  NotificationQueryParams,
} from '../types';

export const notificationApi = {
  async getNotifications(params: NotificationQueryParams = {}): Promise<PaginatedResponse<Notification>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', {
        params,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch notifications');
    }
  },

  async markAsRead(ids: number[]): Promise<void> {
    try {
      const payload: MarkNotificationsReadRequest = { ids };
      await apiClient.patch<ApiResponse<void>>('/notifications/read', payload);
    } catch (error) {
      throw handleApiError(error, 'Failed to mark notifications as read');
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch<ApiResponse<void>>('/notifications/read-all');
    } catch (error) {
      throw handleApiError(error, 'Failed to mark all notifications as read');
    }
  },

  async getUnreadCount(): Promise<NotificationCountResponse> {
    try {
      const response = await apiClient.get<ApiResponse<NotificationCountResponse>>('/notifications/unread-count');
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch unread notification count');
    }
  },

  async deleteNotification(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/notifications/${id}`);
    } catch (error) {
      throw handleApiError(error, 'Failed to delete notification');
    }
  },

  async deleteAllNotifications(): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>('/notifications');
    } catch (error) {
      throw handleApiError(error, 'Failed to delete all notifications');
    }
  },
};
