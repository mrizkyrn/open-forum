import { handleApiError } from '@/utils/helpers';
import { apiClient } from '@/services/client';
import { ApiResponse } from '@/types/ResponseTypes';
import { ActivityData, ActivityDataParams, DashboardStats, StatsParams } from '../types';
import { User, UserRole } from '@/features/users/types';

// export type VoteValue = -1 | 1;

// export const voteApi = {
//   async voteDiscussion(discussionId: number, value: VoteValue): Promise<Discussion> {
//     try {
//       const response = await apiClient.post<ApiResponse<Discussion>>(`/discussions/${discussionId}/votes`, { value });
//       return response.data.data;
//     } catch (error: any) {
//       throw handleApiError(error, 'Failed to vote on discussion');
//     }
//   },

//   async voteComment(commentId: number, value: VoteValue): Promise<Discussion> {
//     try {
//       const response = await apiClient.post<ApiResponse<Discussion>>(`/comments/${commentId}/votes`, { value });
//       return response.data.data;
//     } catch (error: any) {
//       throw handleApiError(error, 'Failed to vote on comment');
//     }
//   },
// };

export interface CreateUserDto {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

// Type for updating an existing user
export interface UpdateUserDto {
  fullName?: string;
  role?: UserRole;
}


export const adminApi = {
  async getDashboardStats(params: StatsParams): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardStats>>('/admin/stats', { params });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to fetch dashboard stats');
    }
  },

  async getActivityData(params: ActivityDataParams): Promise<ActivityData> {
    try {
      const response = await apiClient.get<ApiResponse<ActivityData>>('/admin/activity', { params });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to fetch activity data');
    }
  },

  /**
   * Create a new user (admin only)
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    try {
      const response = await apiClient.post<ApiResponse<User>>('/admin/users', userData);
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to create user');
    }
  },

  /**
   * Update a user (admin only)
   */
  async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}`, userData);
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update user');
    }
  },

  /**
   * Delete a user (admin only)
   */
  async deleteUser(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/admin/users/${id}`);
    } catch (error: any) {
      throw handleApiError(error, 'Failed to delete user');
    }
  },

  /**
   * Change user role (admin only)
   */
  async changeUserRole(id: number, role: UserRole): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}/role`, { role });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to change user role');
    }
  },

  /**
   * Ban a user (admin only)
   */
  async banUser(id: number, reason: string): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}/ban`, { reason });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to ban user');
    }
  },

  /**
   * Unban a user (admin only)
   */
  async unbanUser(id: number): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}/unban`);
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to unban user');
    }
  },

  /**
   * Get user activity statistics (admin only)
   */
  async getUserActivity(id: number, days: number = 30): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/admin/users/${id}/activity`, {
        params: { days },
      });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch user activity');
    }
  },

  /**
   * Perform bulk action on multiple users (admin only)
   */
  async bulkUserAction(
    userIds: number[],
    action: 'ban' | 'unban' | 'delete' | 'changeRole',
    actionData?: any,
  ): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/admin/users/bulk', {
        userIds,
        action,
        actionData,
      });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, `Failed to perform bulk ${action} operation`);
    }
  },
};
