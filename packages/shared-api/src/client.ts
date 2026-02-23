import axios, { type AxiosInstance } from 'axios';

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  onUnauthorized?: () => void;
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseUrl,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (reqConfig) => {
    const token = await config.getToken();
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && config.onUnauthorized) {
        config.onUnauthorized();
      }
      return Promise.reject(error);
    },
  );

  return client;
}
