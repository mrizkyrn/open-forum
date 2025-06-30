import { Discussion } from '@/features/discussions/types';
import { apiClient } from '@/shared/services/client';
import { ApiResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';

export type VoteValue = -1 | 1;

export const voteApi = {
  async getDiscussionVotesCount(discussionId: number): Promise<number> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>(`/discussions/${discussionId}/votes/count`);
      return response.data.data.count;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch discussion votes count');
    }
  },

  async voteDiscussion(discussionId: number, value: VoteValue): Promise<Discussion> {
    try {
      const response = await apiClient.post<ApiResponse<Discussion>>(`/discussions/${discussionId}/votes`, { value });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to vote on discussion');
    }
  },

  async getCommentVotesCount(commentId: number): Promise<number> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>(`/comments/${commentId}/votes/count`);
      return response.data.data.count;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch comment votes count');
    }
  },

  async voteComment(commentId: number, value: VoteValue): Promise<Discussion> {
    try {
      const response = await apiClient.post<ApiResponse<Discussion>>(`/comments/${commentId}/votes`, { value });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to vote on comment');
    }
  },
};
