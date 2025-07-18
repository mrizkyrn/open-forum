import { apiClient } from '@/shared/services/client';
import { ApiResponse, PaginatedResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import { Space, SpaceQueryParams } from '../types';

export const spaceApi = {
  async getSpaces(search: SpaceQueryParams): Promise<PaginatedResponse<Space>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Space>>>('/spaces', {
        params: search,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch spaces');
    }
  },

  async getSpaceById(id: number): Promise<Space> {
    try {
      const response = await apiClient.get<ApiResponse<Space>>(`/spaces/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch space');
    }
  },

  async getSpaceBySlug(slug: string): Promise<Space> {
    try {
      const response = await apiClient.get<ApiResponse<Space>>(`/spaces/slug/${slug}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch space');
    }
  },

  async getPopularSpaces({ limit = 5 }): Promise<Space[]> {
    try {
      const response = await apiClient.get<ApiResponse<Space[]>>('/spaces/popular', {
        params: { limit },
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch popular spaces');
    }
  },

  async isSpaceFollowing(id: number): Promise<void> {
    try {
      const response = await apiClient.get<ApiResponse<void>>(`/spaces/${id}/is-following`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to check if following space');
    }
  },

  async followSpace(id: number): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>(`/spaces/${id}/follow`);
    } catch (error) {
      throw handleApiError(error, 'Failed to follow space');
    }
  },

  async unfollowSpace(id: number): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>(`/spaces/${id}/unfollow`);
    } catch (error) {
      throw handleApiError(error, 'Failed to unfollow space');
    }
  },
};
