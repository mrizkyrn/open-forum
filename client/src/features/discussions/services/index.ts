import {
  CreateDiscussionDto,
  Discussion,
  SearchDiscussionDto,
  UpdateDiscussionDto,
} from '@/features/discussions/types';
import { apiClient } from '@/services/client';
import { ApiResponse, PaginatedResponse } from '@/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';

export const discussionApi = {
  async createDiscussion(data: CreateDiscussionDto): Promise<Discussion> {
    try {
      const formData = new FormData();

      formData.append('content', data.content.trim());
      formData.append('isAnonymous', String(data.isAnonymous));
      formData.append('spaceId', String(data.spaceId));

      if (data.tags?.length) {
        data.tags.forEach((tag) => formData.append('tags', tag));
      }

      if (data.files?.length) {
        data.files.forEach((file) => formData.append('files', file));
      }

      const response = await apiClient.post('/discussions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to create discussion');
    }
  },

  async getDiscussions(search: SearchDiscussionDto): Promise<PaginatedResponse<Discussion>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Discussion>>>('/discussions', {
        params: search,
      });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch discussions');
    }
  },

  async getDiscussionById(id: number): Promise<Discussion> {
    try {
      const response = await apiClient.get<ApiResponse<Discussion>>(`/discussions/${id}`);
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch discussion');
    }
  },

  async updateDiscussion(id: number, data: UpdateDiscussionDto): Promise<Discussion> {
    try {
      const formData = new FormData();

      if (data.content !== undefined) {
        formData.append('content', data.content.trim());
      }

      if (data.isAnonymous !== undefined) {
        formData.append('isAnonymous', String(data.isAnonymous));
      }

      if (data.tags && data.tags.length > 0) {
        data.tags.forEach((tag) => {
          formData.append('tags', tag);
        });
      }

      if (data.files && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append('files', file);
        });
      }

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
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update discussion');
    }
  },

  async deleteDiscussion(id: string | number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/discussions/${id}`);
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete discussion');
    }
  },

  async bookmarkDiscussion(id: string | number): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>(`/discussions/${id}/bookmark`);
    } catch (error: any) {
      return handleApiError(error, 'Failed to bookmark discussion');
    }
  },

  async unbookmarkDiscussion(id: string | number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/discussions/${id}/bookmark`);
    } catch (error: any) {
      return handleApiError(error, 'Failed to unbookmark discussion');
    }
  },
};
