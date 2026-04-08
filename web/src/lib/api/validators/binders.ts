import { z } from 'zod';

const binderCategoryEnum = z.enum(['RESTAURANT', 'WINE', 'SPIRIT', 'MIXED']);
const visibilityEnum = z.enum(['PUBLIC', 'PRIVATE']);

export const createBinderSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: binderCategoryEnum,
  visibility: visibilityEnum.optional(),
});

export const updateBinderSchema = z.object({
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  visibility: visibilityEnum.optional(),
  coverUrl: z.string().url().optional(),
});
