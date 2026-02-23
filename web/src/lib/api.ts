import {
  createApiClient,
  createAuthApi,
  createUsersApi,
  createBindersApi,
  createTagsApi,
  createVenuesApi,
  createPhotosApi,
  createNotesApi,
  createSearchApi,
} from '@mygourmetdiary/shared-api';
import { getIdToken } from './firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

let onUnauthorizedCallback: (() => void) | undefined;

export function setOnUnauthorized(cb: () => void) {
  onUnauthorizedCallback = cb;
}

export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  getToken: async () => {
    // In dev mode, check for dev token
    if (process.env.NODE_ENV === 'development') {
      const devToken = typeof window !== 'undefined' ? sessionStorage.getItem('dev_token') : null;
      if (devToken) return devToken;
    }
    return getIdToken();
  },
  onUnauthorized: () => onUnauthorizedCallback?.(),
});

export const authApi = createAuthApi(apiClient);
export const usersApi = createUsersApi(apiClient);
export const bindersApi = createBindersApi(apiClient);
export const tagsApi = createTagsApi(apiClient);
export const venuesApi = createVenuesApi(apiClient);
export const photosApi = createPhotosApi(apiClient);
export const notesApi = createNotesApi(apiClient);
export const searchApi = createSearchApi(apiClient);
