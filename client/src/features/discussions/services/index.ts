import { apiClient } from '@/shared/services/client';
import { ApiResponse, PaginatedResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import {
  CreateDiscussionRequest,
  Discussion,
  DiscussionQueryParams,
  PopularTagsResponse,
  UpdateDiscussionRequest,
} from '../types';

export const discussionApi = {
  async createDiscussion(data: CreateDiscussionRequest): Promise<Discussion> {
    try {
      const formData = new FormData();

      // Required fields
      formData.append('content', data.content.trim());
      formData.append('isAnonymous', String(data.isAnonymous));
      formData.append('spaceId', String(data.spaceId));

      // Optional fields
      if (data.tags?.length) {
        data.tags.forEach((tag) => formData.append('tags', tag));
      }

      // File uploads
      if (data.files?.length) {
        data.files.forEach((file) => formData.append('files', file));
      }

      const response = await apiClient.post('/discussions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to create discussion');
    }
  },

  async getDiscussions(search: DiscussionQueryParams): Promise<PaginatedResponse<Discussion>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Discussion>>>('/discussions', {
        params: search,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch discussions');
    }
  },

  async getDiscussionById(id: number): Promise<Discussion> {
    try {
      const response = await apiClient.get<ApiResponse<Discussion>>(`/discussions/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch discussion');
    }
  },

  async getBookmarkedDiscussions(search: DiscussionQueryParams): Promise<PaginatedResponse<Discussion>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Discussion>>>('/discussions/bookmarked', {
        params: search,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch bookmarked discussions');
    }
  },

  async getPopularTags({ page = 1, limit = 10 }): Promise<PaginatedResponse<PopularTagsResponse>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<PopularTagsResponse>>>(
        '/discussions/tags/popular',
        {
          params: { page, limit },
        },
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch popular tags');
    }
  },

  async updateDiscussion(id: number, data: UpdateDiscussionRequest): Promise<Discussion> {
    try {
      const formData = new FormData();

      // Optional fields
      if (data.content !== undefined) {
        formData.append('content', data.content.trim());
      }
      if (data.isAnonymous !== undefined) {
        formData.append('isAnonymous', String(data.isAnonymous));
      }
      if (data.tags !== undefined) {
        if (data.tags.length > 0) {
          data.tags.forEach((tag) => {
            formData.append('tags', tag);
          });
        } else {
          formData.append('tags', '');
        }
      }

      // File uploads
      if (data.files && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      // Attachments to remove
      if (data.attachmentsToRemove && data.attachmentsToRemove.length > 0) {
        data.attachmentsToRemove.forEach((id) => {
          formData.append('attachmentsToRemove', String(id));
        });
      }

      const response = await apiClient.put<ApiResponse<Discussion>>(`/discussions/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to update discussion');
    }
  },

  async deleteDiscussion(id: string | number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/discussions/${id}`);
    } catch (error) {
      return handleApiError(error, 'Failed to delete discussion');
    }
  },

  async bookmarkDiscussion(id: string | number): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>(`/discussions/${id}/bookmark`);
    } catch (error) {
      return handleApiError(error, 'Failed to bookmark discussion');
    }
  },

  async unbookmarkDiscussion(id: string | number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/discussions/${id}/bookmark`);
    } catch (error) {
      return handleApiError(error, 'Failed to unbookmark discussion');
    }
  },
};
