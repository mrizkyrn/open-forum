import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useReducer } from 'react';
import { AuthContext } from './AuthContext';
import { authReducer, initialState } from './reducer';

import { authApi } from '@/features/auth/services';
import { LoginRequest } from '@/features/auth/types';
import { pushNotificationService } from '@/features/notifications/services/pushNotificationService';
import { userApi } from '@/features/users/services';
import { User } from '@/features/users/types';
import { storageUtils } from '@/utils/storage';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

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

  const updateUser = useCallback(
    (userData: Partial<User>) => {
      if (state.user) {
        const updatedUser = { ...state.user, ...userData };
        storageUtils.setUser(updatedUser);
        dispatch({
          type: 'UPDATE_USER',
          payload: { user: updatedUser },
        });
      }
    },
    [state.user],
  );

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

      try {
        if (pushNotificationService.isPushNotificationSupported()) {
          const permission = await pushNotificationService.getNotificationPermission();
          if (permission === 'granted') {
            await pushNotificationService.reactivateSubscription();
          }
        }
      } catch (error) {
        console.error('Failed to reactivate push notifications:', error);
      }

      return user;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  };

  const OAuthLogin = useCallback(
    async (accessToken: string): Promise<void> => {
      try {
        dispatch({ type: 'AUTH_START' });

        const user = await userApi.getCurrentUser(accessToken);

        storageUtils.setUser(user);
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken } });
        queryClient.clear();

        try {
          if (pushNotificationService.isPushNotificationSupported()) {
            const permission = await pushNotificationService.getNotificationPermission();
            if (permission === 'granted') {
              await pushNotificationService.reactivateSubscription();
            }
          }
        } catch (error) {
          console.error('Failed to reactivate push notifications:', error);
        }
      } catch (error) {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: error instanceof Error ? error.message : 'OAuth login failed',
        });
        throw error;
      }
    },
    [queryClient],
  );

  const logout = async (): Promise<void> => {
    try {
      try {
        if (pushNotificationService.isPushNotificationSupported()) {
          const permission = await pushNotificationService.getNotificationPermission();
          if (permission === 'granted') {
            await pushNotificationService.deactivateSubscription();
          }
        }
      } catch (error) {
        console.error('Failed to deactivate push notifications:', error);
      }

      await authApi.logout();
    } finally {
      storageUtils.clearUser();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

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
    updateUser,
    clearError,
    refreshToken,
    OAuthLogin,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
