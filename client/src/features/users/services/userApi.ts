import { handleApiError } from '@/utils/helpers';
import { apiClient } from '@/services/client';
import { SearchUserParams, User, UserRole } from '@/features/users/types';
import { ApiResponse, PaginatedResponse } from '@/types/ResponseTypes';

// Type for creating a new user
export interface CreateUserDto {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

// Type for updating an existing user
export interface UpdateUserDto {
  fullName?: string;
  role?: UserRole;
}

// User API service with comprehensive error handling
export const userApi = {
  /**
   * Get paginated list of users with filters
   */
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

  /**
   * Get a specific user by ID
   */
  async getUserById(id: number): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch user details');
    }
  },

  /**
   * Get current authenticated user's profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/users/me');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch current user profile');
    }
  },

  /**
   * Update current user's profile
   */
  async updateCurrentUser(data: UpdateUserDto): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>('/users/me', data);
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update profile');
    }
  },

  /**
   * Upload avatar for current user
   */
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

  /**
   * Remove current user's avatar
   */
  async removeAvatar(): Promise<User> {
    try {
      const response = await apiClient.delete<ApiResponse<User>>('/users/me/avatar');
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to remove avatar');
    }
  },
};
