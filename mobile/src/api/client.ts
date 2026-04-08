import axios from 'axios';
import { getIdToken } from '../auth/supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request — get directly from Supabase
apiClient.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  console.log('[API]', config.method?.toUpperCase(), config.url, 'token:', token ? 'YES(' + token.substring(0, 20) + ')' : 'NULL');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — log only, don't clear session (prevents clearing during startup)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('API returned 401');
    }
    return Promise.reject(error);
  },
);
