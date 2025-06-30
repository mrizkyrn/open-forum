import { apiClient } from '@/shared/services/client';
import { ApiResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import { LoginRequest, LoginResponse, RefreshTokenResponse } from '../types';

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Authentication failed');
    }
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    try {
      const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh');
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Token refresh failed');
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    }
  },
};
