import { randomUUID } from 'crypto';
import { prisma } from '../clients/prisma';
import { supabaseAdmin } from '../clients/supabase-server';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

const SIGNED_URL_TTL_SECONDS = 60 * 5;

type PhotoLike = { r2Key: string; publicUrl: string };
type WithPhotos = { photos?: PhotoLike[] };

async function batchSignPhotoUrls(keys: string[]): Promise<Map<string, string>> {
  if (keys.length === 0) return new Map();
  const { data, error } = await supabaseAdmin.storage
    .from('photos')
    .createSignedUrls(Array.from(new Set(keys)), SIGNED_URL_TTL_SECONDS);
  if (error || !data) return new Map();
  const out = new Map<string, string>();
  for (const entry of data) {
    if (entry.path && entry.signedUrl) out.set(entry.path, entry.signedUrl);
  }
  return out;
}

async function attachSignedUrlsToItems<T extends WithPhotos>(items: T[]): Promise<T[]> {
  const keys: string[] = [];
  for (const item of items) {
    for (const p of item.photos ?? []) keys.push(p.r2Key);
  }
  const signed = await batchSignPhotoUrls(keys);
  if (signed.size === 0) return items;
  for (const item of items) {
    for (const p of item.photos ?? []) {
      const url = signed.get(p.r2Key);
      if (url) p.publicUrl = url;
    }
  }
  return items;
}

async function attachSignedUrlsToItem<T extends WithPhotos>(item: T): Promise<T> {
  await attachSignedUrlsToItems([item]);
  return item;
}

export const photosService = {
  attachSignedUrlsToItems,
  attachSignedUrlsToItem,

  async presign(uploaderId: string, mimeType: string, sizeBytes: number) {
    const ext = MIME_TO_EXT[mimeType] || 'jpg';
    const key = `${uploaderId}/${randomUUID()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from('photos')
      .createSignedUploadUrl(key);

    if (error || !data) {
      throw new Error(`Failed to create upload URL: ${error?.message}`);
    }

    const signedRead = await supabaseAdmin.storage
      .from('photos')
      .createSignedUrl(key, SIGNED_URL_TTL_SECONDS);
    const publicUrl = signedRead.data?.signedUrl ?? '';

    const photo = await prisma.photo.create({
      data: {
        uploaderId,
        r2Key: key,
        publicUrl,
        mimeType,
        sizeBytes,
      },
    });

    return {
      uploadUrl: data.signedUrl,
      token: data.token,
      photo,
    };
  },

  async remove(id: string, userId: string) {
    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) throw new Error('Photo not found');
    if (photo.uploaderId !== userId) throw new Error('Forbidden');

    await supabaseAdmin.storage.from('photos').remove([photo.r2Key]);
    await prisma.photo.delete({ where: { id } });
  },

  async getSignedReadUrl(photoId: string, viewerId: string) {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        note: {
          select: {
            authorId: true,
            visibility: true,
            author: {
              select: {
                gourmetFriendPins: { where: { pinnedId: viewerId }, select: { id: true } },
              },
            },
          },
        },
      },
    });
    if (!photo) throw new Error('Photo not found');

    const canView = (() => {
      if (photo.uploaderId === viewerId) return true;
      if (!photo.note) return false;
      if (photo.note.visibility === 'PUBLIC') return true;
      if (photo.note.authorId === viewerId) return true;
      if (photo.note.visibility === 'FRIENDS' && photo.note.author.gourmetFriendPins.length > 0) {
        return true;
      }
      return false;
    })();
    if (!canView) throw new Error('Photo not found');

    const { data, error } = await supabaseAdmin.storage
      .from('photos')
      .createSignedUrl(photo.r2Key, SIGNED_URL_TTL_SECONDS);
    if (error || !data) {
      throw new Error(`Failed to sign URL: ${error?.message}`);
    }

    return {
      url: data.signedUrl,
      expiresAt: Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS,
    };
  },

  async cleanupOrphans() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const orphans = await prisma.photo.findMany({
      where: { noteId: null, createdAt: { lt: oneHourAgo } },
    });

    if (orphans.length === 0) return 0;

    for (const photo of orphans) {
      try {
        await supabaseAdmin.storage.from('photos').remove([photo.r2Key]);
      } catch (e) {
        console.error(`Failed to delete storage object ${photo.r2Key}`, e);
      }
    }

    await prisma.photo.deleteMany({
      where: { id: { in: orphans.map((p: { id: string }) => p.id) } },
    });

    return orphans.length;
  },
};
