import { handleApiError } from '@/utils/helpers';
import { apiClient } from './client';
import { LoginResponse, RefreshTokenResponse, RegisterResponse } from '@/types/AuthTypes';
import { ApiResponse } from '@/types/ResponseTypes';

export const authApi = {
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { username, password });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Authentication failed');
    }
  },

  async register(username: string, fullName: string, password: string): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', {
        username,
        fullName,
        password,
      });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Registration failed');
    }
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    try {
      const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', {});
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Token refresh failed');
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error', error);
    }
  },
};
