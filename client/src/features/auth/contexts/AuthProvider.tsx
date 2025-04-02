import { useCallback, useEffect, useReducer } from 'react';
import { storageUtils } from '@/utils/storage';
import { authApi } from '@/features/auth/services/authApi';
import { LoginRequest, RegisterRequest } from '@/features/auth/types';
import { AuthContext } from './AuthContext';
import { authReducer, initialState } from './reducer';
import { User } from '@/features/users/types';
import { useQueryClient } from '@tanstack/react-query';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(authReducer, initialState);

  const refreshToken = useCallback(async (): Promise<string> => {
    try {
      const { accessToken } = await authApi.refreshToken();
      dispatch({ type: 'REFRESH_TOKEN', payload: { accessToken } });
      return accessToken;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Token refresh failed',
      });
      throw error;
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        dispatch({ type: 'AUTH_START' });

        const user = storageUtils.getUser();
        if (!user) {
          dispatch({ type: 'AUTH_INIT_COMPLETE' });
          return;
        }

        const newAccessToken = await refreshToken();

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, accessToken: newAccessToken },
        });
      } catch (error) {
        console.error('Authentication initialization failed:', error);
        storageUtils.clearUser();
        dispatch({
          type: 'AUTH_FAILURE',
          payload: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    initialize();
  }, [refreshToken]);

  const login = async (credentials: LoginRequest): Promise<User> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const { user, accessToken } = await authApi.login(credentials);

      storageUtils.setUser(user);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken } });

      queryClient.clear();
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const { user, accessToken } = await authApi.register(userData);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken } });
    } catch (error) {
      console.error('Registration failed:', error);
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Registration failed',
      });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      storageUtils.clearUser();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Context value
  const contextValue = {
    // State
    user: state.user,
    accessToken: state.accessToken,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    logout,
    register,
    clearError,
    refreshToken,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
