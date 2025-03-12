import { handleApiError } from '@/utils/helpers';
import { apiClient } from '@/services/client';
import { ApiResponse } from '@/types/ResponseTypes';
import { ActivityData, ActivityDataParams, DashboardStats, StatsParams } from '../types';

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
};
