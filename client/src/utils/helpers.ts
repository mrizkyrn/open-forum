import { formatDistanceToNow } from 'date-fns';

export const handleApiError = (error: any, defaultMessage: string): never => {
  if (error.response) {
    const { data } = error.response;
    if (data?.error && Array.isArray(data.error)) {
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

export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getFromCurrentUrl = (key: string) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key) || null;
};
