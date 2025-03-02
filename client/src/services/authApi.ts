import { handleApiError } from '@/utils/helpers';
import { authClient } from './client';
import { User } from '@/contexts/auth/types';

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  statusCode: number;
}

export const authApi = {
  async login(username: string, password: string): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const response = await authClient.post<ApiResponse<LoginResponse>>('/auth/login', { username, password });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Authentication failed');
    }
  },

  async register(username: string, email: string, password: string): Promise<RegisterResponse> {
    try {
      const response = await authClient.post<ApiResponse<RegisterResponse>>('/auth/register', {
        username,
        email,
        password,
      });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Registration failed');
    }
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    console.log('refreshToken');
    try {
      const response = await authClient.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', {});
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Token refresh failed');
    }
  },

  async logout(): Promise<void> {
    try {
      await authClient.post('/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error', error);
    }
  },
};
