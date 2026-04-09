import { ProductCategory } from '@prisma/client';
import { prisma } from '../clients/prisma';

export function normalizeProductName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export const productsService = {
  async search(query: string, category?: ProductCategory, limit = 10) {
    const normalized = normalizeProductName(query);
    if (!normalized) return [];
    return prisma.product.findMany({
      where: {
        name: { contains: normalized, mode: 'insensitive' },
        ...(category ? { category } : {}),
      },
      orderBy: { name: 'asc' },
      take: limit,
    });
  },

  async create(data: {
    name: string;
    category: ProductCategory;
    subType?: string;
    producer?: string;
    vintage?: number;
    region?: string;
    abv?: number;
    createdBy: string;
  }) {
    const name = normalizeProductName(data.name);
    if (!name) throw new Error('Product name is required');
    return prisma.product.create({ data: { ...data, name } });
  },

  async getById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },
};
