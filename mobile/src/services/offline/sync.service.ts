import { Paths, Directory, File } from 'expo-file-system';
import { syncApi } from '../../api/endpoints';
import {
  getSyncMeta,
  setSyncMeta,
  upsertNote,
  upsertPhoto,
  upsertVenue,
  upsertBinder,
  getPendingMutations,
  removePendingMutation,
  clearDatabase,
} from './database';
import { apiClient } from '../../api/client';

const PHOTO_CACHE_DIR_NAME = 'photo_cache';

function getPhotoCacheDir(): Directory {
  return new Directory(Paths.document, PHOTO_CACHE_DIR_NAME);
}

function ensurePhotoCacheDir(): void {
  const dir = getPhotoCacheDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

async function cachePhoto(photoId: string, publicUrl: string): Promise<string | null> {
  try {
    ensurePhotoCacheDir();
    const ext = publicUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const destination = new File(getPhotoCacheDir(), `${photoId}.${ext}`);

    if (destination.exists) return destination.uri;

    const downloaded = await File.downloadFileAsync(publicUrl, destination, {
      idempotent: true,
    });
    return downloaded.uri;
  } catch {
    return null;
  }
}

export async function downloadNotesForOffline(
  onProgress?: (downloaded: number, hasMore: boolean) => void,
): Promise<void> {
  const lastSync = await getSyncMeta('lastSyncAt');
  let cursor: string | undefined;
  let totalDownloaded = 0;

  do {
    const result = await syncApi.exportNotes(lastSync ?? undefined, cursor);

    // Store binders
    for (const binder of result.binders) {
      await upsertBinder(binder);
    }

    // Store notes, photos, and venues
    for (const note of result.notes) {
      await upsertNote(note);

      if (note.venue) {
        await upsertVenue(note.venue);
      }

      if (note.photos) {
        for (const photo of note.photos) {
          const localPath = await cachePhoto(photo.id, photo.publicUrl);
          await upsertPhoto({ ...photo, localPath });
        }
      }
    }

    totalDownloaded += result.notes.length;
    cursor = result.nextCursor ?? undefined;

    onProgress?.(totalDownloaded, result.hasMore);
  } while (cursor);

  await setSyncMeta('lastSyncAt', new Date().toISOString());
}

export async function replayPendingMutations(): Promise<{
  replayed: number;
  failed: number;
}> {
  const mutations = await getPendingMutations();
  let replayed = 0;
  let failed = 0;

  for (const mutation of mutations) {
    try {
      switch (mutation.type) {
        case 'POST':
          await apiClient.post(mutation.endpoint, mutation.payload);
          break;
        case 'PATCH':
          await apiClient.patch(mutation.endpoint, mutation.payload);
          break;
        case 'DELETE':
          await apiClient.delete(mutation.endpoint);
          break;
      }
      await removePendingMutation(mutation.id);
      replayed++;
    } catch {
      failed++;
    }
  }

  return { replayed, failed };
}

export async function clearOfflineData(): Promise<void> {
  await clearDatabase();

  try {
    const dir = getPhotoCacheDir();
    if (dir.exists) {
      dir.delete();
    }
  } catch {
    // ignore cleanup errors
  }
}

export async function getOfflineStorageSize(): Promise<number> {
  try {
    const dir = getPhotoCacheDir();
    if (!dir.exists) return 0;
    return dir.size ?? 0;
  } catch {
    return 0;
  }
}
