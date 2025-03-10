import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/api/v1';

// Regular API client without credentials
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  paramsSerializer: {
    indexes: null,
  },
});
