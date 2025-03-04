import { handleApiError } from '@/utils/helpers';
import { apiClient } from './client';
import { Discussion } from '@/types/DiscussionTypes';
import { ApiResponse, PaginatedResponse } from '@/types/ResponseTypes';

export const discussionApi = {
  async getDiscussions(page = 1, limit = 10): Promise<PaginatedResponse<Discussion>> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Discussion>>>('/discussions', {
        params: { page, limit },
      });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch discussions');
    }
  },

  async getDiscussionById(id: string | number): Promise<Discussion> {
    try {
      const response = await apiClient.get<ApiResponse<Discussion>>(`/discussions/${id}`);
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch discussion');
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
