import axios from 'axios';
import { getBrowserAuthToken } from './auth-token';
import { getApiBaseUrl } from './env';

const instance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 120000,
});

instance.interceptors.request.use((config) => {
  const token = getBrowserAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 402) {
      const msg = error.response.data?.error?.message || 'Insufficient credits for this action. Please upgrade your plan for 20,000 credits.';
      if (typeof window !== 'undefined' && window.confirm(`${msg}\n\nWould you like to view subscription plans now?`)) {
        window.location.href = '/dashboard';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
