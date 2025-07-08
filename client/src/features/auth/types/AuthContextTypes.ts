import { User } from '@/features/users/types';
import { LoginRequest } from './AuthTypes';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; accessToken: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_INIT_COMPLETE' }
  | { type: 'UPDATE_USER'; payload: { user: User } }
  | { type: 'REFRESH_TOKEN'; payload: { accessToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  refreshToken: () => Promise<string>;
  OAuthLogin: (accessToken: string) => Promise<void>;
}
