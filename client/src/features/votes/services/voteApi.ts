import { handleApiError } from '@/utils/helpers';
import { apiClient } from '@/services/client';
import { Discussion } from '@/features/discussions/types';
import { ApiResponse } from '@/types/ResponseTypes';

export type VoteValue = -1 | 1;

export const voteApi = {
  async voteDiscussion(discussionId: number, value: VoteValue): Promise<Discussion> {
    try {
      const response = await apiClient.post<ApiResponse<Discussion>>(`/discussions/${discussionId}/votes`, { value });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to vote on discussion');
    }
  },

  async voteComment(commentId: number, value: VoteValue): Promise<Discussion> {
    try {
      const response = await apiClient.post<ApiResponse<Discussion>>(`/comments/${commentId}/votes`, { value });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to vote on comment');
    }
  },
};
