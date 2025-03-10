import { handleApiError } from '@/utils/helpers';
import { apiClient } from '@/services/client';
import { ApiResponse } from '@/types/ResponseTypes';
import { Space } from '../types/spaceResponseTypes';

export const spaceApi = {
  async createSpace(formData: FormData): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>('/spaces', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error: any) {
      throw handleApiError(error, 'Failed to create space');
    }
  },

  async followSpace(spaceId: number): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>(`/spaces/${spaceId}/follow`);
    } catch (error: any) {
      throw handleApiError(error, 'Failed to follow space');
    }
  },

  async unfollowSpace(spaceId: number): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>(`/spaces/${spaceId}/unfollow`);
    } catch (error: any) {
      throw handleApiError(error, 'Failed to unfollow space');
    }
  },

  async getSpaces(): Promise<void> {
    try {
      const response = await apiClient.get<ApiResponse<void>>('/spaces');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch spaces');
    }
  },

  async getSpaceById(id: number): Promise<void> {
    try {
      const response = await apiClient.get<ApiResponse<void>>(`/spaces/${id}`);
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch space');
    }
  },

  async getSpaceBySlug(slug: string): Promise<Space> {
    try {
      const response = await apiClient.get<ApiResponse<Space>>(`/spaces/slug/${slug}`);
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch space');
    }
  },

  async updateSpace(id: number, formData: FormData): Promise<void> {
    try {
      await apiClient.put<ApiResponse<void>>(`/spaces/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update space');
    }
  },

  async deleteSpace(id: string | number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/spaces/${id}`);
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete space');
    }
  },
};
