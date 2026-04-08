import type { BinderCategory, Visibility } from '@prisma/client';
import { prisma } from '../clients/prisma';

export const bindersService = {
  async findAllByOwner(ownerId: string) {
    return prisma.binder.findMany({
      where: { ownerId },
      include: { _count: { select: { notes: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  },

  async findById(id: string, userId: string) {
    const binder = await prisma.binder.findUnique({
      where: { id },
      include: { _count: { select: { notes: true } } },
    });
    if (!binder) throw new Error('Binder not found');
    if (binder.ownerId !== userId) throw new Error('Forbidden');
    return binder;
  },

  async create(
    ownerId: string,
    data: { name: string; description?: string; category: BinderCategory; visibility?: Visibility },
  ) {
    return prisma.binder.create({
      data: {
        ownerId,
        name: data.name,
        description: data.description,
        category: data.category,
        visibility: data.visibility,
      },
    });
  },

  async update(
    id: string,
    userId: string,
    data: { name?: string; description?: string; visibility?: Visibility; coverUrl?: string },
  ) {
    const binder = await bindersService.findById(id, userId);
    return prisma.binder.update({
      where: { id: binder.id },
      data,
    });
  },

  async remove(id: string, userId: string) {
    const binder = await bindersService.findById(id, userId);
    if (binder.isDefault) {
      throw new Error('Cannot delete default binders');
    }
    await prisma.binder.delete({ where: { id: binder.id } });
  },

  async findPublicByOwner(ownerId: string) {
    return prisma.binder.findMany({
      where: { ownerId, visibility: 'PUBLIC' },
      include: {
        _count: { select: { notes: true, followers: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  },
};
