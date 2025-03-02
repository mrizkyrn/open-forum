export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

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
  | { type: 'REFRESH_TOKEN'; payload: { accessToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<string>;
}
