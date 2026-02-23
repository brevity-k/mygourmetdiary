import type { AxiosInstance } from 'axios';
import type {
  ApiResponse,
  Binder,
  Note,
  NoteType,
  PaginatedResponse,
  PresignResponse,
  SearchResult,
  Tag,
  User,
} from '@mygourmetdiary/shared-types';

export function createAuthApi(client: AxiosInstance) {
  return {
    register: () =>
      client.post<ApiResponse<User>>('/auth/register').then((r) => r.data.data),
    me: () =>
      client.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),
  };
}

export function createUsersApi(client: AxiosInstance) {
  return {
    getMe: () =>
      client.get<ApiResponse<User>>('/users/me').then((r) => r.data.data),
    updateMe: (data: { displayName?: string; avatarUrl?: string }) =>
      client.patch<ApiResponse<User>>('/users/me', data).then((r) => r.data.data),
  };
}

export function createBindersApi(client: AxiosInstance) {
  return {
    list: () =>
      client.get<ApiResponse<Binder[]>>('/binders').then((r) => r.data.data),
    get: (id: string) =>
      client.get<ApiResponse<Binder>>(`/binders/${id}`).then((r) => r.data.data),
    create: (data: { name: string; category: string; description?: string; visibility?: string }) =>
      client.post<ApiResponse<Binder>>('/binders', data).then((r) => r.data.data),
    update: (id: string, data: { name?: string; description?: string; visibility?: string }) =>
      client.patch<ApiResponse<Binder>>(`/binders/${id}`, data).then((r) => r.data.data),
    remove: (id: string) =>
      client.delete(`/binders/${id}`),
  };
}

export function createTagsApi(client: AxiosInstance) {
  return {
    list: (category?: string, group?: string) => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (group) params.set('group', group);
      return client
        .get<ApiResponse<Tag[]>>(`/tags?${params}`)
        .then((r) => r.data.data);
    },
  };
}

export function createVenuesApi(client: AxiosInstance) {
  return {
    search: (q: string, lat?: number, lng?: number) => {
      const params = new URLSearchParams({ q });
      if (lat !== undefined) params.set('lat', String(lat));
      if (lng !== undefined) params.set('lng', String(lng));
      return client
        .get<ApiResponse<any[]>>(`/venues/search?${params}`)
        .then((r) => r.data.data);
    },
    get: (placeId: string) =>
      client.get<ApiResponse<any>>(`/venues/${placeId}`).then((r) => r.data.data),
  };
}

export function createPhotosApi(client: AxiosInstance) {
  return {
    presign: (mimeType: string, sizeBytes: number) =>
      client
        .post<ApiResponse<PresignResponse>>('/photos/presign', { mimeType, sizeBytes })
        .then((r) => r.data.data),
    remove: (id: string) =>
      client.delete(`/photos/${id}`),
    upload: async (uploadUrl: string, file: Blob, mimeType: string) => {
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: file,
      });
    },
  };
}

export function createNotesApi(client: AxiosInstance) {
  return {
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
      return client
        .get<ApiResponse<PaginatedResponse<Note>>>(`/notes/feed?${searchParams}`)
        .then((r) => r.data.data);
    },
    get: (id: string) =>
      client.get<ApiResponse<Note>>(`/notes/${id}`).then((r) => r.data.data),
    create: (data: any) =>
      client.post<ApiResponse<Note>>('/notes', data).then((r) => r.data.data),
    update: (id: string, data: any) =>
      client.patch<ApiResponse<Note>>(`/notes/${id}`, data).then((r) => r.data.data),
    remove: (id: string) =>
      client.delete(`/notes/${id}`),
    attachPhotos: (noteId: string, photoIds: string[]) =>
      client
        .post<ApiResponse<Note>>(`/notes/${noteId}/photos`, { photoIds })
        .then((r) => r.data.data),
  };
}

export function createSearchApi(client: AxiosInstance) {
  return {
    search: (q: string, type?: string, limit?: number, offset?: number) => {
      const params = new URLSearchParams({ q });
      if (type) params.set('type', type);
      if (limit) params.set('limit', String(limit));
      if (offset) params.set('offset', String(offset));
      return client
        .get<ApiResponse<SearchResult>>(`/search?${params}`)
        .then((r) => r.data.data);
    },
  };
}
