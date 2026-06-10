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

export default instance;
