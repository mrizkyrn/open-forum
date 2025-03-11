import { formatDistanceToNow } from 'date-fns';

export const handleApiError = (error: any, defaultMessage: string): never => {
  if (error.response) {
    const { data } = error.response;
    console.error('API error:', data);
    if (data?.error && Array.isArray(data.error)) {
      console.error('API error:', data.error[0]);
      throw new Error(data.error[0] || data.message || defaultMessage);
    } else {
      throw new Error(data?.message || defaultMessage);
    }
  }

  throw new Error(error.message || 'Network error');
};

export const getFileUrl = (url: string) => {
  return import.meta.env.VITE_API_URL + url;
};

export const formatDateDistance = (date: string | number | Date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};
