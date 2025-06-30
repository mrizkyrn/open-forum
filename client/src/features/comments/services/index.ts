import { apiClient } from '@/shared/services/client';
import { ApiResponse, PaginatedResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import { Comment, CommentQueryParams, CreateCommentRequest, UpdateCommentRequest } from '../types';

export const commentApi = {
  async createComment(discussionId: number, data: CreateCommentRequest): Promise<Comment> {
    const formData = new FormData();

    // Required fields
    formData.append('content', data.content);

    // Optional fields
    if (data.parentId) {
      formData.append('parentId', String(data.parentId));
    }

    // File uploads
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => formData.append('files', file));
    }

    try {
      const response = await apiClient.post<ApiResponse<Comment>>(`/discussions/${discussionId}/comments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to create comment');
    }
  },

  async getCommentsByDiscussionId(
    discussionId: number,
    search: CommentQueryParams,
  ): Promise<PaginatedResponse<Comment>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Comment>>>(
        `/discussions/${discussionId}/comments`,
        { params: search },
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch comments');
    }
  },

  async getCommentById(commentId: number): Promise<Comment> {
    try {
      const response = await apiClient.get<ApiResponse<Comment>>(`/comments/${commentId}`);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch comment');
    }
  },

  async getRepliesByCommentId(commentId: number, search: CommentQueryParams): Promise<PaginatedResponse<Comment>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Comment>>>(`/comments/${commentId}/replies`, {
        params: search,
      });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch replies');
    }
  },

  async updateComment(commentId: number, data: UpdateCommentRequest): Promise<Comment> {
    const formData = new FormData();

    // Optional fields
    if (data.content) {
      formData.append('content', data.content.trim());
    }
    if (data.attachmentsToRemove && data.attachmentsToRemove.length > 0) {
      data.attachmentsToRemove.forEach((id) => formData.append('attachmentsToRemove', String(id)));
    }

    // File uploads
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => formData.append('files', file));
    }

    try {
      const response = await apiClient.put<ApiResponse<Comment>>(`/comments/${commentId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to update comment');
    }
  },

  async deleteComment(commentId: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/comments/${commentId}`);
    } catch (error) {
      throw handleApiError(error, 'Failed to delete comment');
    }
  },
};
