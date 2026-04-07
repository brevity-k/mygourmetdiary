import { z } from 'zod';

export const updateUserSchema = z.object({
  displayName: z.string().max(50).optional(),
  avatarUrl: z.string().url().optional(),
});
