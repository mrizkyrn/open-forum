import { handleApiError } from '@/utils/helpers';
import { apiClient } from '@/services/client';
import { ApiResponse } from '@/types/ResponseTypes';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/features/auth/types';

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Authentication failed');
    }
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', userData);
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
