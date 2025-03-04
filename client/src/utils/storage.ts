import { User } from '@/contexts/auth/types';

const USER_KEY = 'user';

export const storageUtils = {
  // Get user from localStorage
  getUser(): User | null {
    try {
      const userJson = localStorage.getItem(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      return null;
    }
  },

  // Save only user data
  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Clear user data
  clearUser(): void {
    console.log('Clearing user data');
    localStorage.removeItem(USER_KEY);
  },
};
