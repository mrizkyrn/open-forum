import { User } from '@/features/users/types';

// ===== REQUEST TYPES =====

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
}

// ===== RESPONSE TYPES =====

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface RegisterResponse {
  message: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
