import { apiClient } from '@/shared/services/client';
import { ApiResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import { LoginRequest, LoginResponse, RefreshTokenResponse, RegisterRequest, RegisterResponse } from '../types';

export const authApi = {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Registration failed');
    }
  },

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

  async verifyEmail(token: string): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<ApiResponse<RegisterResponse>>(`/auth/verify-email?token=${token}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Email verification failed');
    }
  },

  async resendEmailVerification(email: string): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/resend-verification', { email });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to resend verification email');
    }
  },
};
