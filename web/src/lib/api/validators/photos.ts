import { z } from 'zod';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const presignPhotoSchema = z.object({
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  sizeBytes: z.number().int().min(1).max(MAX_SIZE),
});
