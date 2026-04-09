import { z } from 'zod';

// ─── Extension Enums ───────────────────────────────────

const dishCategoryEnum = z.enum(['APPETIZER', 'MAIN', 'DESSERT', 'SIDE', 'DRINK', 'OTHER']);
const portionSizeEnum = z.enum(['SMALL', 'ADEQUATE', 'GENEROUS']);
const wineTypeEnum = z.enum(['RED', 'WHITE', 'ROSE', 'SPARKLING', 'ORANGE', 'DESSERT']);
const wineFinishEnum = z.enum(['SHORT', 'MEDIUM', 'LONG']);
const spiritTypeEnum = z.enum(['WHISKEY', 'SAKE', 'TEQUILA', 'RUM', 'GIN', 'BRANDY', 'VODKA', 'OTHER']);
const servingMethodEnum = z.enum(['NEAT', 'ON_ROCKS', 'COCKTAIL', 'WARM', 'OTHER']);
const purchaseContextEnum = z.enum(['RESTAURANT', 'WINE_SHOP', 'WINERY', 'ONLINE']);

// ─── Extension Schemas ─────────────────────────────────

export const restaurantExtensionSchema = z.object({
  dishName: z.string(),
  dishCategory: dishCategoryEnum,
  wouldOrderAgain: z.boolean(),
  pricePaid: z.number().min(0).optional(),
  portionSize: portionSizeEnum.optional(),
  cuisineTags: z.array(z.string()).optional(),
});

export const wineExtensionSchema = z.object({
  wineName: z.string(),
  vintage: z.number().optional(),
  grapeVarietal: z.array(z.string()).optional(),
  region: z.string().optional(),
  wineType: wineTypeEnum,
  noseTags: z.array(z.string()).optional(),
  palateTags: z.array(z.string()).optional(),
  finish: wineFinishEnum.optional(),
  pricePaid: z.number().min(0).optional(),
  pairingNotes: z.string().optional(),
  purchaseContext: purchaseContextEnum.optional(),
});

export const spiritExtensionSchema = z.object({
  spiritName: z.string(),
  spiritType: spiritTypeEnum,
  subType: z.string().optional(),
  distillery: z.string().optional(),
  ageStatement: z.string().optional(),
  abv: z.number().min(0).max(100).optional(),
  noseTags: z.array(z.string()).optional(),
  palateTags: z.array(z.string()).optional(),
  finishTags: z.array(z.string()).optional(),
  servingMethod: servingMethodEnum.optional(),
  pricePaid: z.number().min(0).optional(),
});

export const wineryVisitExtensionSchema = z.object({
  ambianceRating: z.number().min(1).max(10).optional(),
  serviceRating: z.number().min(1).max(10).optional(),
  wouldRevisit: z.boolean(),
  reservationRequired: z.boolean().optional(),
  tastingFlightNoteIds: z.array(z.string()).optional(),
});

// ─── Extension Validation Map ──────────────────────────

const extensionSchemaMap: Record<string, z.ZodType> = {
  RESTAURANT: restaurantExtensionSchema,
  WINE: wineExtensionSchema,
  SPIRIT: spiritExtensionSchema,
  WINERY_VISIT: wineryVisitExtensionSchema,
};

export function validateExtension(type: string, extension: unknown): { success: boolean; error?: string } {
  const schema = extensionSchemaMap[type];
  if (!schema) {
    return { success: false, error: `Unknown note type: ${type}` };
  }
  const result = schema.safeParse(extension);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? 'Invalid extension data' };
  }
  return { success: true };
}

// ─── Note Schemas ──────────────────────────────────────

const noteTypeEnum = z.enum(['RESTAURANT', 'WINE', 'SPIRIT', 'WINERY_VISIT']);
const visibilityEnum = z.enum(['PUBLIC', 'PRIVATE', 'FRIENDS']);

export const createNoteSchema = z.object({
  type: noteTypeEnum,
  title: z.string().min(1).max(200),
  binderId: z.string(),
  rating: z.number().int().min(1).max(10),
  freeText: z.string().max(5000).optional(),
  visibility: visibilityEnum.optional(),
  tagIds: z.array(z.string()).optional(),
  extension: z.record(z.string(), z.unknown()),
  venueId: z.string().optional(),
  productId: z.string().optional(),
  experiencedAt: z.string().datetime({ offset: true }).or(z.string().date()),
  photoIds: z.array(z.string()).optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().max(200).optional(),
  binderId: z.string().optional(),
  rating: z.number().int().min(1).max(10).optional(),
  freeText: z.string().max(5000).optional(),
  visibility: visibilityEnum.optional(),
  tagIds: z.array(z.string()).optional(),
  extension: z.record(z.string(), z.unknown()).optional(),
  experiencedAt: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
});

export const attachPhotosSchema = z.object({
  photoIds: z.array(z.string()).min(1),
});
