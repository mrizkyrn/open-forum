import { User } from '@/features/users/types';

// ===== REQUEST TYPES =====

export interface LoginRequest {
  username: string;
  password: string;
}

// ===== RESPONSE TYPES =====

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
