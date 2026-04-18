import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../clients/prisma', () => ({
  prisma: {
    binder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { bindersService } from './binders.service';
import { prisma } from '../clients/prisma';

const mockFindUnique = prisma.binder.findUnique as ReturnType<typeof vi.fn>;
const mockDelete = prisma.binder.delete as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('bindersService.findById', () => {
  it('throws "Binder not found" when prisma returns null', async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    await expect(bindersService.findById('non-existent', 'user-1')).rejects.toThrow(
      'Binder not found',
    );
  });

  it('throws "Forbidden" when ownerId does not match userId', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'binder-1',
      ownerId: 'other-user',
      _count: { notes: 0 },
    });
    await expect(bindersService.findById('binder-1', 'user-1')).rejects.toThrow('Forbidden');
  });

  it('returns binder when ownership matches', async () => {
    const binder = { id: 'binder-1', ownerId: 'user-1', _count: { notes: 3 } };
    mockFindUnique.mockResolvedValueOnce(binder);
    const result = await bindersService.findById('binder-1', 'user-1');
    expect(result).toEqual(binder);
  });
});

describe('bindersService.remove', () => {
  it('throws "Cannot delete default binders" when binder.isDefault is true', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'binder-1',
      ownerId: 'user-1',
      isDefault: true,
      _count: { notes: 5 },
    });
    await expect(bindersService.remove('binder-1', 'user-1')).rejects.toThrow(
      'Cannot delete default binders',
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('calls prisma.binder.delete for non-default binders', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'binder-1',
      ownerId: 'user-1',
      isDefault: false,
      _count: { notes: 0 },
    });
    mockDelete.mockResolvedValueOnce({});
    await bindersService.remove('binder-1', 'user-1');
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'binder-1' } });
  });

  it('throws "Forbidden" if user does not own the binder', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'binder-1',
      ownerId: 'other-user',
      isDefault: false,
      _count: { notes: 0 },
    });
    await expect(bindersService.remove('binder-1', 'user-1')).rejects.toThrow('Forbidden');
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
