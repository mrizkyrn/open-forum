import { handleApiError } from '@/utils/helpers';
import { apiClient } from '@/services/client';
import { ApiResponse, PaginatedResponse } from '@/types/ResponseTypes';
import { Notification, NotificationQueryParams, NotificationCountResponse, MarkNotificationsReadDto } from '../types';

/**
 * Service for handling notification-related API requests
 */
export const notificationApi = {
  /**
   * Get paginated list of user notifications
   */
  async getNotifications(params: NotificationQueryParams = {}): Promise<PaginatedResponse<Notification>> {
    console.log(params);
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', {
        params,
      });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch notifications');
    }
  },

  /**
   * Mark specific notifications as read
   */
  async markAsRead(ids: number[]): Promise<void> {
    try {
      const payload: MarkNotificationsReadDto = { ids };
      await apiClient.patch<ApiResponse<void>>('/notifications/read', payload);
    } catch (error: any) {
      throw handleApiError(error, 'Failed to mark notifications as read');
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch<ApiResponse<void>>('/notifications/read-all');
    } catch (error: any) {
      throw handleApiError(error, 'Failed to mark all notifications as read');
    }
  },

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<NotificationCountResponse> {
    try {
      const response = await apiClient.get<ApiResponse<NotificationCountResponse>>('/notifications/unread-count');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch unread notification count');
    }
  },

  /**
   * Delete a specific notification
   */
  async deleteNotification(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/notifications/${id}`);
    } catch (error: any) {
      throw handleApiError(error, 'Failed to delete notification');
    }
  },

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>('/notifications');
    } catch (error: any) {
      throw handleApiError(error, 'Failed to delete all notifications');
    }
  },
};
