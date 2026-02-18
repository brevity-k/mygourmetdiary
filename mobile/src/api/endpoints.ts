import { apiClient } from './client';
import {
  ApiResponse,
  Binder,
  Note,
  PaginatedResponse,
  PresignResponse,
  SearchResult,
  Tag,
  User,
  NoteType,
} from '../types';

// ─── Auth ───────────────────────────────────────────────

export const authApi = {
  register: () =>
    apiClient.post<ApiResponse<User>>('/auth/register').then((r) => r.data.data),
  me: () =>
    apiClient.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),
};

// ─── Users ──────────────────────────────────────────────

export const usersApi = {
  getMe: () =>
    apiClient.get<ApiResponse<User>>('/users/me').then((r) => r.data.data),
  updateMe: (data: { displayName?: string; avatarUrl?: string }) =>
    apiClient.patch<ApiResponse<User>>('/users/me', data).then((r) => r.data.data),
};

// ─── Binders ────────────────────────────────────────────

export const bindersApi = {
  list: () =>
    apiClient.get<ApiResponse<Binder[]>>('/binders').then((r) => r.data.data),
  get: (id: string) =>
    apiClient.get<ApiResponse<Binder>>(`/binders/${id}`).then((r) => r.data.data),
  create: (data: { name: string; category: string; description?: string; visibility?: string }) =>
    apiClient.post<ApiResponse<Binder>>('/binders', data).then((r) => r.data.data),
  update: (id: string, data: { name?: string; description?: string; visibility?: string }) =>
    apiClient.patch<ApiResponse<Binder>>(`/binders/${id}`, data).then((r) => r.data.data),
  remove: (id: string) =>
    apiClient.delete(`/binders/${id}`),
};

// ─── Tags ───────────────────────────────────────────────

export const tagsApi = {
  list: (category?: string, group?: string) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (group) params.set('group', group);
    return apiClient
      .get<ApiResponse<Tag[]>>(`/tags?${params}`)
      .then((r) => r.data.data);
  },
};

// ─── Venues ─────────────────────────────────────────────

export const venuesApi = {
  search: (q: string, lat?: number, lng?: number) => {
    const params = new URLSearchParams({ q });
    if (lat !== undefined) params.set('lat', String(lat));
    if (lng !== undefined) params.set('lng', String(lng));
    return apiClient
      .get<ApiResponse<any[]>>(`/venues/search?${params}`)
      .then((r) => r.data.data);
  },
  get: (placeId: string) =>
    apiClient.get<ApiResponse<any>>(`/venues/${placeId}`).then((r) => r.data.data),
};

// ─── Photos ─────────────────────────────────────────────

export const photosApi = {
  presign: (mimeType: string, sizeBytes: number) =>
    apiClient
      .post<ApiResponse<PresignResponse>>('/photos/presign', { mimeType, sizeBytes })
      .then((r) => r.data.data),
  remove: (id: string) =>
    apiClient.delete(`/photos/${id}`),
  upload: async (uploadUrl: string, uri: string, mimeType: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: blob,
    });
  },
};

// ─── Notes ──────────────────────────────────────────────

export const notesApi = {
  feed: (params: {
    cursor?: string;
    limit?: number;
    type?: NoteType;
    binderId?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.type) searchParams.set('type', params.type);
    if (params.binderId) searchParams.set('binderId', params.binderId);
    return apiClient
      .get<ApiResponse<PaginatedResponse<Note>>>(`/notes/feed?${searchParams}`)
      .then((r) => r.data.data);
  },
  get: (id: string) =>
    apiClient.get<ApiResponse<Note>>(`/notes/${id}`).then((r) => r.data.data),
  create: (data: any) =>
    apiClient.post<ApiResponse<Note>>('/notes', data).then((r) => r.data.data),
  update: (id: string, data: any) =>
    apiClient.patch<ApiResponse<Note>>(`/notes/${id}`, data).then((r) => r.data.data),
  remove: (id: string) =>
    apiClient.delete(`/notes/${id}`),
  attachPhotos: (noteId: string, photoIds: string[]) =>
    apiClient
      .post<ApiResponse<Note>>(`/notes/${noteId}/photos`, { photoIds })
      .then((r) => r.data.data),
};

// ─── Search ─────────────────────────────────────────────

export const searchApi = {
  search: (q: string, type?: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams({ q });
    if (type) params.set('type', type);
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    return apiClient
      .get<ApiResponse<SearchResult>>(`/search?${params}`)
      .then((r) => r.data.data);
  },
};
