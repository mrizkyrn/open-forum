import { AxiosInstance } from 'axios';
import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { authClient } from '@/services/client';

export const useAxios = (): AxiosInstance => {
  // Destructure auth values from your auth context hook.
  const { accessToken, refreshToken, logout } = useAuth();

  // Use refs to track refreshing state and pending requests.
  const isRefreshing = useRef(false);
  const failedRequests = useRef<Array<(token: string) => void>>([]);

  useEffect(() => {
    // Request interceptor: attach the current access token to headers.
    const requestInterceptor = authClient.interceptors.request.use(
      (config) => {
        // Only add token if it's not already there
        if (!config.headers.Authorization && accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor: handle 401 errors by attempting a token refresh.
    const responseInterceptor = authClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          // If already refreshing, queue the request
          if (isRefreshing.current) {
            return new Promise((resolve) => {
              failedRequests.current.push((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(authClient(originalRequest));
              });
            });
          }

          // Set retry flags
          originalRequest._retry = true;
          isRefreshing.current = true;

          try {
            // Attempt to refresh the token.
            const newAccessToken = await refreshToken();

            // Process queued requests with new token
            failedRequests.current.forEach((callback) => callback(newAccessToken));
            failedRequests.current = [];

            // Update request header and retry
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return authClient(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed in interceptor:', refreshError);

            // If refresh fails, log out and reject the request.
            logout();

            return Promise.reject(refreshError);
          } finally {
            isRefreshing.current = false;
          }
        }
        // If the error is not 401 or already retried, just reject.
        return Promise.reject(error);
      },
    );

    // Cleanup interceptors on unmount
    return () => {
      authClient.interceptors.request.eject(requestInterceptor);
      authClient.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, logout, refreshToken]);

  return authClient;
};

export default useAxios;
