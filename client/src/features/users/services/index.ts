import { apiClient } from '@/shared/services/client';
import { ApiResponse, PaginatedResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import { SearchUserParams, User, UserDetail } from '../types';

export const userApi = {
  async getUsers(params: SearchUserParams): Promise<PaginatedResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>('/users', {
        params,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch users');
    }
  },

  async getCurrentUser(accessToken?: string): Promise<UserDetail> {
    try {
      const config: any = {};
      
      if (accessToken) {
        config.headers = {
          'Authorization': `Bearer ${accessToken}`
        };
      }
      
      const response = await apiClient.get<ApiResponse<UserDetail>>('/users/me', config);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch current user profile');
    }
  },

  async getUserById(id: number): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch user details');
    }
  },

  async getUserByUsername(username: string): Promise<UserDetail> {
    try {
      const response = await apiClient.get<ApiResponse<UserDetail>>(`/users/username/${username}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch user by username');
    }
  },

  async uploadAvatar(file: File): Promise<User> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.post<ApiResponse<User>>('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to upload avatar');
    }
  },

  async removeAvatar(): Promise<User> {
    try {
      const response = await apiClient.delete<ApiResponse<User>>('/users/me/avatar');
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to remove avatar');
    }
  },
};
