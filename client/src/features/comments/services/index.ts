import { apiClient } from '@/services/client';
import { ApiResponse, PaginatedResponse } from '@/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import { Comment, CommentSortBy } from '../types';
import { SortOrder } from '@/types/SearchTypes';

export const commentApi = {
  async getCommentsByDiscussion(
    discussionId: number,
    page: number,
    limit: number,
    sortBy: CommentSortBy,
    sortOrder: SortOrder = SortOrder.DESC,
  ): Promise<PaginatedResponse<Comment>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Comment>>>(
        `/discussions/${discussionId}/comments`,
        {
          params: { page, limit, sortBy, sortOrder },
        },
      );
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to fetch comments');
    }
  },

  async getCommentById(commentId: number): Promise<Comment> {
    try {
      const response = await apiClient.get<ApiResponse<Comment>>(`/comments/${commentId}`);
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to fetch comment');
    }
  },

  async getCommentReplies(
    commentId: number,
    page: number,
    limit: number,
    sortOrder: SortOrder = SortOrder.ASC,
  ): Promise<PaginatedResponse<Comment>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Comment>>>(`/comments/${commentId}/replies`, {
        params: { page, limit, sortOrder },
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
