import { randomUUID } from 'crypto';
import { prisma } from '../clients/prisma';
import { supabaseAdmin } from '../clients/supabase-server';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

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
      where: { id: { in: orphans.map((p) => p.id) } },
    });

    return orphans.length;
  },
};
