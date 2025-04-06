import { SearchUserParams, User, UserDetail } from '@/features/users/types';
import { apiClient } from '@/services/client';
import { ApiResponse, PaginatedResponse } from '@/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';

// User API service with comprehensive error handling
export const userApi = {
  async getUsers(params: SearchUserParams): Promise<PaginatedResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>('/users', {
        params,
      });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch users');
    }
  },

  async getUserById(id: number): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch user details');
    }
  },

  async getUserByUsername(username: string): Promise<UserDetail> {
    try {
      const response = await apiClient.get<ApiResponse<UserDetail>>(`/users/username/${username}`);
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch user by username');
    }
  },

  async getCurrentUser(): Promise<UserDetail> {
    try {
      const response = await apiClient.get<ApiResponse<UserDetail>>('/users/me');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch current user profile');
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
    } catch (error: any) {
      throw handleApiError(error, 'Failed to upload avatar');
    }
  },

  async removeAvatar(): Promise<User> {
    try {
      const response = await apiClient.delete<ApiResponse<User>>('/users/me/avatar');
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to remove avatar');
    }
  },
};
