import { apiClient } from './client';
import {
  ApiResponse,
  Binder,
  CanPinResult,
  GourmetFriend,
  MapPin,
  MenuDeciderResponse,
  Note,
  NoteType,
  NotificationPreferences,
  PaginatedResponse,
  PioneerBadge,
  PioneerZone,
  PresignResponse,
  PublicBinder,
  PublicProfile,
  SearchResult,
  SocialNote,
  SubscriptionStatus,
  Tag,
  TasteCategory,
  TasteSignal,
  TasteSignalSummary,
  TasteSignalType,
  TasteSimilarity,
  TieredSearchResult,
  User,
  UserSuggestion,
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

// ─── Phase 2: Social APIs ──────────────────────────────

export const exploreApi = {
  publicFeed: (params: { cursor?: string; limit?: number; type?: NoteType }) => {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.type) searchParams.set('type', params.type);
    return apiClient
      .get<ApiResponse<PaginatedResponse<SocialNote>>>(`/notes/public/feed?${searchParams}`)
      .then((r) => r.data.data);
  },
  followedFeed: (params: { cursor?: string; limit?: number; type?: NoteType }) => {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.type) searchParams.set('type', params.type);
    return apiClient
      .get<ApiResponse<PaginatedResponse<SocialNote>>>(`/notes/social/feed?${searchParams}`)
      .then((r) => r.data.data);
  },
};

export const socialSearchApi = {
  search: (q: string, type?: string, limit?: number) => {
    const params = new URLSearchParams({ q });
    if (type) params.set('type', type);
    if (limit) params.set('limit', String(limit));
    return apiClient
      .get<ApiResponse<TieredSearchResult>>(`/search/public?${params}`)
      .then((r) => r.data.data);
  },
};

export const profilesApi = {
  getProfile: (userId: string) =>
    apiClient
      .get<ApiResponse<PublicProfile>>(`/users/${userId}/profile`)
      .then((r) => r.data.data),
  getPublicBinders: (userId: string) =>
    apiClient
      .get<ApiResponse<PublicBinder[]>>(`/users/${userId}/binders`)
      .then((r) => r.data.data),
  getPublicNotes: (userId: string, cursor?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    return apiClient
      .get<ApiResponse<PaginatedResponse<Note>>>(`/notes/public/feed?authorId=${userId}&${params}`)
      .then((r) => r.data.data);
  },
  getTasteSimilarity: (userId: string) =>
    apiClient
      .get<ApiResponse<TasteSimilarity[]>>(`/friends/${userId}/compatibility`)
      .then((r) => r.data.data),
};

export const binderFollowsApi = {
  follow: (binderId: string) =>
    apiClient
      .post<ApiResponse<any>>(`/binders/${binderId}/follow`)
      .then((r) => r.data.data),
  unfollow: (binderId: string) =>
    apiClient.delete(`/binders/${binderId}/follow`),
  listFollowed: (cursor?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    return apiClient
      .get<ApiResponse<PaginatedResponse<{ binder: PublicBinder }>>>(`/users/me/following?${params}`)
      .then((r) => r.data.data);
  },
};

export const tasteSignalsApi = {
  send: (noteId: string, signalType: TasteSignalType, senderRating?: number) =>
    apiClient
      .post<ApiResponse<TasteSignal>>(`/notes/${noteId}/signals`, {
        signalType,
        senderRating,
      })
      .then((r) => r.data.data),
  remove: (noteId: string, signalType: TasteSignalType) =>
    apiClient.delete(`/notes/${noteId}/signals/${signalType}`),
  getSummary: (noteId: string) =>
    apiClient
      .get<ApiResponse<TasteSignalSummary>>(`/notes/${noteId}/signals`)
      .then((r) => r.data.data),
};

export const gourmetFriendsApi = {
  list: () =>
    apiClient
      .get<ApiResponse<GourmetFriend[]>>('/friends')
      .then((r) => r.data.data),
  pin: (pinnedId: string, categories: TasteCategory[]) =>
    apiClient
      .post<ApiResponse<any>>('/friends/pin', { pinnedId, categories })
      .then((r) => r.data.data),
  unpin: (pinnedId: string) =>
    apiClient.delete(`/friends/pin/${pinnedId}`),
  updateCategories: (pinnedId: string, categories: TasteCategory[]) =>
    apiClient
      .patch<ApiResponse<any>>(`/friends/pin/${pinnedId}`, { categories })
      .then((r) => r.data.data),
  canPin: (userId: string) =>
    apiClient
      .get<ApiResponse<CanPinResult>>(`/friends/${userId}/can-pin`)
      .then((r) => r.data.data),
};

export const discoveryApi = {
  getSimilarUsers: (category?: TasteCategory, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    return apiClient
      .get<ApiResponse<{ items: UserSuggestion[]; total: number }>>(`/discover/similar-users?${params}`)
      .then((r) => r.data.data);
  },
};

// ─── Phase 3: Advisor APIs ──────────────────────────────

export const subscriptionsApi = {
  getStatus: () =>
    apiClient
      .get<ApiResponse<SubscriptionStatus>>('/subscriptions/status')
      .then((r) => r.data.data),
};

export const menuDeciderApi = {
  getRecommendations: (venueId: string) =>
    apiClient
      .get<ApiResponse<MenuDeciderResponse>>(`/menu-decider/${venueId}`)
      .then((r) => r.data.data),
};

export const areaExplorerApi = {
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
    return apiClient
      .get<ApiResponse<MapPin[]>>(`/explore/map?${searchParams}`)
      .then((r) => r.data.data);
  },
};

export const notificationsApi = {
  registerToken: (token: string, platform: string) =>
    apiClient
      .post('/notifications/token', { token, platform })
      .then((r) => r.data.data),
  removeToken: () =>
    apiClient.delete('/notifications/token'),
  getPreferences: () =>
    apiClient
      .get<ApiResponse<NotificationPreferences>>('/notifications/preferences')
      .then((r) => r.data.data),
  updatePreferences: (prefs: Partial<NotificationPreferences>) =>
    apiClient
      .patch<ApiResponse<NotificationPreferences>>('/notifications/preferences', prefs)
      .then((r) => r.data.data),
};

export const pioneersApi = {
  getZones: (lat: number, lng: number, radiusKm?: number) => {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
    });
    if (radiusKm) params.set('radiusKm', String(radiusKm));
    return apiClient
      .get<ApiResponse<PioneerZone[]>>(`/pioneers/zones?${params}`)
      .then((r) => r.data.data);
  },
  getBadges: () =>
    apiClient
      .get<ApiResponse<PioneerBadge[]>>('/pioneers/badges')
      .then((r) => r.data.data),
};

export const syncApi = {
  exportNotes: (since?: string, cursor?: string) => {
    const params = new URLSearchParams();
    if (since) params.set('since', since);
    if (cursor) params.set('cursor', cursor);
    return apiClient
      .get<ApiResponse<any>>(`/sync/export?${params}`)
      .then((r) => r.data.data);
  },
};
