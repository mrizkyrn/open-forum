import { apiClient } from '@/services/client';
import { handleApiError } from '@/utils/helpers';
import { ApiResponse, PaginatedResponse } from '@/types/ResponseTypes';
import { Comment, CreateCommentRequest, UpdateCommentRequest } from '../types';

export const commentApi = {
  async getCommentsByDiscussion(discussionId: number): Promise<PaginatedResponse<Comment>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Comment>>>(
        `/discussions/${discussionId}/comments`,
      );
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to fetch comments');
    }
  },

  async createComment(data: CreateCommentRequest): Promise<Comment> {
    try {
      const response = await apiClient.post<ApiResponse<Comment>>('/comments', data);
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to create comment');
    }
  },

  async updateComment(commentId: number, data: UpdateCommentRequest): Promise<Comment> {
    try {
      const response = await apiClient.put<ApiResponse<Comment>>(`/comments/${commentId}`, data);
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
