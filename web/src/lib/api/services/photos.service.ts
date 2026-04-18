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

export const photosService = {
  async presign(uploaderId: string, mimeType: string, sizeBytes: number) {
    const ext = MIME_TO_EXT[mimeType] || 'jpg';
    const key = `${uploaderId}/${randomUUID()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from('photos')
      .createSignedUploadUrl(key);

    if (error || !data) {
      throw new Error(`Failed to create upload URL: ${error?.message}`);
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${key}`;

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
