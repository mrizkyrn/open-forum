import { handleApiError } from '@/utils/helpers';
import { apiClient } from '@/services/client';
import { Discussion, SearchDiscussionDto } from '@/features/discussions/types';
import { ApiResponse, PaginatedResponse } from '@/types/ResponseTypes';

export const discussionApi = {
  async createDiscussion(formData: FormData): Promise<Discussion> {
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const response = await apiClient.post<ApiResponse<Discussion>>('/discussions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to create discussion');
    }
  },

  async getDiscussions(search: SearchDiscussionDto): Promise<PaginatedResponse<Discussion>> {
    // await new Promise((resolve) => setTimeout(resolve, 1000));
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
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const response = await apiClient.get<ApiResponse<Discussion>>(`/discussions/${id}`);
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch discussion');
    }
  },

  async updateDiscussion(id: number, formData: FormData): Promise<Discussion> {
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
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
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      await apiClient.delete<ApiResponse<void>>(`/discussions/${id}`);
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete discussion');
    }
  },

  async bookmarkDiscussion(id: string | number): Promise<void> {
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      await apiClient.post<ApiResponse<void>>(`/discussions/${id}/bookmark`);
    } catch (error: any) {
      return handleApiError(error, 'Failed to bookmark discussion');
    }
  },

  async unbookmarkDiscussion(id: string | number): Promise<void> {
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      await apiClient.delete<ApiResponse<void>>(`/discussions/${id}/bookmark`);
    } catch (error: any) {
      return handleApiError(error, 'Failed to unbookmark discussion');
    }
  },
};
