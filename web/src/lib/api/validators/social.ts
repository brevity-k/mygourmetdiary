import { z } from 'zod';

const signalTypeEnum = z.enum(['BOOKMARKED', 'ECHOED', 'DIVERGED']);
const tasteCategoryEnum = z.enum(['RESTAURANT', 'WINE', 'SPIRIT']);

export const createSignalSchema = z
  .object({
    signalType: signalTypeEnum,
    senderRating: z.number().int().min(1).max(10).optional(),
  })
  .refine(
    (data) => {
      if (data.signalType === 'ECHOED' || data.signalType === 'DIVERGED') {
        return data.senderRating !== undefined;
      }
      return true;
    },
    { message: 'senderRating is required for ECHOED and DIVERGED signals' },
  );

export const pinFriendSchema = z.object({
  pinnedId: z.string().min(1),
  categories: z.array(tasteCategoryEnum).min(1),
});

export const updatePinSchema = z.object({
  categories: z.array(tasteCategoryEnum).min(1),
});

export const followBinderSchema = z.object({
  binderId: z.string().min(1),
});
