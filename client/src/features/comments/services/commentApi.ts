import { apiClient } from '@/services/client';
import { handleApiError } from '@/utils/helpers';
import { ApiResponse, PaginatedResponse } from '@/types/ResponseTypes';
import { Comment } from '../types';

export const commentApi = {
  async getCommentsByDiscussion(
    discussionId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<Comment>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Comment>>>(
        `/discussions/${discussionId}/comments`,
        {
          params: { page, limit },
        },
      );
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to fetch comments');
    }
  },

  async getCommentReplies(commentId: number, page: number, limit: number): Promise<PaginatedResponse<Comment>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Comment>>>(`/comments/${commentId}/replies`, {
        params: { page, limit },
      });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to fetch replies');
    }
  },

  async createComment(discussionId: number, formData: FormData): Promise<Comment> {
    try {
      const response = await apiClient.post<ApiResponse<Comment>>(`/discussions/${discussionId}/comments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to create comment');
    }
  },

  async updateComment(commentId: number, formData: FormData): Promise<Comment> {
    console.log('commentId', commentId);
    // log all form data
    for (var pair of formData.entries()) {
      console.log(pair[0] + ', ' + pair[1]);
    }
    try {
      const response = await apiClient.put<ApiResponse<Comment>>(`/comments/${commentId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update comment');
    }
  },

  async deleteComment(commentId: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/comments/${commentId}`);
    } catch (error: any) {
      throw handleApiError(error, 'Failed to delete comment');
    }
  },
};
