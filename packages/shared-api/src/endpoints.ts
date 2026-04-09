import type { AxiosInstance } from 'axios';
import type {
  ApiResponse,
  Binder,
  MapPin,
  Note,
  NoteExtension,
  NoteType,
  PaginatedResponse,
  PresignResponse,
  SearchResult,
  SocialNote,
  Tag,
  User,
  Venue,
  Visibility,
} from '@mygourmetdiary/shared-types';

export interface CreateNoteInput {
  type: NoteType;
  title: string;
  binderId: string;
  rating: number;
  freeText: string;
  visibility: Visibility;
  tagIds: string[];
  extension: NoteExtension | Record<string, unknown>;
  venueId: string | null;
  productId?: string | null;
  experiencedAt: string;
  photoIds?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  binderId?: string;
  rating?: number;
  freeText?: string | null;
  visibility?: Visibility;
  tagIds?: string[];
  extension?: NoteExtension | Record<string, unknown>;
  venueId?: string | null;
  experiencedAt?: string;
}

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
        .get<ApiResponse<Venue[]>>(`/venues/search?${params}`)
        .then((r) => r.data.data);
    },
    get: (placeId: string) =>
      client.get<ApiResponse<Venue>>(`/venues/${placeId}`).then((r) => r.data.data),
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
    create: (data: CreateNoteInput) =>
      client.post<ApiResponse<Note>>('/notes', data).then((r) => r.data.data),
    update: (id: string, data: UpdateNoteInput) =>
      client.patch<ApiResponse<Note>>(`/notes/${id}`, data).then((r) => r.data.data),
    remove: (id: string) =>
      client.delete(`/notes/${id}`),
    attachPhotos: (noteId: string, photoIds: string[]) =>
      client
        .post<ApiResponse<Note>>(`/notes/${noteId}/photos`, { photoIds })
        .then((r) => r.data.data),
  };
}

export function createAreaExplorerApi(client: AxiosInstance) {
  return {
    getMapPins: (params: {
      lat: number;
      lng: number;
      radiusKm?: number;
      category?: string;
      friendsOnly?: boolean;
    }) => {
      const searchParams = new URLSearchParams({
        lat: String(params.lat),
        lng: String(params.lng),
      });
      if (params.radiusKm) searchParams.set('radiusKm', String(params.radiusKm));
      if (params.category) searchParams.set('category', params.category);
      if (params.friendsOnly) searchParams.set('friendsOnly', 'true');
      return client
        .get<ApiResponse<MapPin[]>>(`/explore/map?${searchParams}`)
        .then((r) => r.data.data);
    },
    getVenueNotes: (venueId: string, limit?: number) => {
      const params = limit ? `?limit=${limit}` : '';
      return client
        .get<ApiResponse<SocialNote[]>>(`/explore/venue/${venueId}/notes${params}`)
        .then((r) => r.data.data);
    },
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
    searchAll: (q: string, type?: string, limit?: number, offset?: number) => {
      const params = new URLSearchParams({ q });
      if (type) params.set('type', type);
      if (limit) params.set('limit', String(limit));
      if (offset) params.set('offset', String(offset));
      return client
        .get<ApiResponse<SearchResult>>(`/search/all?${params}`)
        .then((r) => r.data.data);
    },
  };
}

export function createCommunityApi(client: AxiosInstance) {
  return {
    getStats: (subjectType: string, subjectId: string) =>
      client.get(`/community/${subjectType}/${subjectId}/stats`).then((r) => r.data.data),
    getGourmets: (subjectType: string, subjectId: string, limit?: number) => {
      const params = limit ? `?limit=${limit}` : '';
      return client.get(`/community/${subjectType}/${subjectId}/gourmets${params}`).then((r) => r.data.data);
    },
    getNotes: (subjectType: string, subjectId: string, cursor?: string, limit?: number) => {
      const searchParams = new URLSearchParams();
      if (cursor) searchParams.set('cursor', cursor);
      if (limit) searchParams.set('limit', String(limit));
      const qs = searchParams.toString();
      return client.get(`/community/${subjectType}/${subjectId}/notes${qs ? `?${qs}` : ''}`).then((r) => r.data.data);
    },
  };
}

export function createProductsApi(client: AxiosInstance) {
  return {
    search: (query: string, category?: string) =>
      client.post('/products/search', { query, category }).then((r) => r.data.data),
    create: (data: { name: string; category: string; subType?: string; producer?: string; vintage?: number; region?: string; abv?: number }) =>
      client.post('/products', data).then((r) => r.data.data),
    get: (id: string) =>
      client.get(`/products/${id}`).then((r) => r.data.data),
  };
}

export function createSocialApi(client: AxiosInstance) {
  return {
    // Gourmet Friends
    listFriends: () =>
      client.get<ApiResponse<any[]>>('/social/friends').then((r) => r.data.data),
    getCompatibility: (userId: string) =>
      client.get<ApiResponse<any>>(`/social/friends?userId=${userId}`).then((r) => r.data.data),
    canPin: (userId: string) =>
      client.get<ApiResponse<any>>(`/social/friends?userId=${userId}&action=can-pin`).then((r) => r.data.data),
    pinFriend: (pinnedId: string, categories: string[]) =>
      client.post<ApiResponse<any>>('/social/friends', { pinnedId, categories }).then((r) => r.data.data),
    unpinFriend: (pinnedId: string) =>
      client.delete(`/social/friends?pinnedId=${pinnedId}`),

    // Discover
    discoverUsers: (category?: string, limit?: number, offset?: number) => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (limit) params.set('limit', String(limit));
      if (offset) params.set('offset', String(offset));
      const qs = params.toString();
      return client
        .get<ApiResponse<any>>(`/social/friends/discover${qs ? `?${qs}` : ''}`)
        .then((r) => r.data.data);
    },

    // Follows
    listFollowing: (cursor?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      return client
        .get<ApiResponse<any>>(`/social/follows${qs ? `?${qs}` : ''}`)
        .then((r) => r.data.data);
    },
    followBinder: (binderId: string) =>
      client.post<ApiResponse<any>>('/social/follows', { binderId }).then((r) => r.data.data),
    unfollowBinder: (binderId: string) =>
      client.delete(`/social/follows?binderId=${binderId}`),

    // Signals
    getSignalSummary: (noteId: string) =>
      client.get<ApiResponse<any>>(`/social/signals?noteId=${noteId}`).then((r) => r.data.data),
    sendSignal: (noteId: string, signalType: string, senderRating?: number) =>
      client.post<ApiResponse<any>>('/social/signals', { noteId, signalType, senderRating }).then((r) => r.data.data),
    removeSignal: (noteId: string, signalType: string) =>
      client.delete(`/social/signals?noteId=${noteId}&signalType=${signalType}`),

    // User profiles
    getPublicProfile: (userId: string) =>
      client.get<ApiResponse<any>>(`/users/${userId}`).then((r) => r.data.data),
  };
}
