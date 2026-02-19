import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { BindersService } from './binders.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BindersService', () => {
  let service: BindersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      binder: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BindersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BindersService>(BindersService);
  });

  afterEach(() => jest.clearAllMocks());

  // --- findAllByOwner ---

  it('returns all binders for owner ordered by isDefault then createdAt', async () => {
    const binders = [
      { id: 'b1', ownerId: 'u1', isDefault: true, _count: { notes: 3 } },
      { id: 'b2', ownerId: 'u1', isDefault: false, _count: { notes: 0 } },
    ];
    prisma.binder.findMany.mockResolvedValue(binders);

    const result = await service.findAllByOwner('u1');

    expect(result).toEqual(binders);
    expect(prisma.binder.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'u1' },
      include: { _count: { select: { notes: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  });

  // --- findById ---

  it('returns binder when found and owned by user', async () => {
    const binder = { id: 'b1', ownerId: 'u1', _count: { notes: 5 } };
    prisma.binder.findUnique.mockResolvedValue(binder);

    const result = await service.findById('b1', 'u1');
    expect(result).toEqual(binder);
  });

  it('throws NotFoundException when binder not found', async () => {
    prisma.binder.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ForbiddenException when binder belongs to different user', async () => {
    prisma.binder.findUnique.mockResolvedValue({
      id: 'b1',
      ownerId: 'other-user',
    });

    await expect(service.findById('b1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  // --- create ---

  it('creates a binder with provided dto', async () => {
    const dto = {
      name: 'Tokyo Ramen',
      description: 'Best ramen spots',
      category: 'RESTAURANT' as const,
      visibility: 'PUBLIC' as const,
    };
    const created = { id: 'b-new', ownerId: 'u1', ...dto };
    prisma.binder.create.mockResolvedValue(created);

    const result = await service.create('u1', dto);

    expect(result).toEqual(created);
    expect(prisma.binder.create).toHaveBeenCalledWith({
      data: {
        ownerId: 'u1',
        name: dto.name,
        description: dto.description,
        category: dto.category,
        visibility: dto.visibility,
      },
    });
  });

  // --- update ---

  it('updates binder after verifying ownership', async () => {
    const existing = { id: 'b1', ownerId: 'u1', _count: { notes: 0 } };
    prisma.binder.findUnique.mockResolvedValue(existing);
    const updated = { ...existing, name: 'Updated Name' };
    prisma.binder.update.mockResolvedValue(updated);

    const result = await service.update('b1', 'u1', { name: 'Updated Name' });

    expect(result).toEqual(updated);
    expect(prisma.binder.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: { name: 'Updated Name' },
    });
  });

  // --- remove ---

  it('throws BadRequestException when deleting default binder', async () => {
    prisma.binder.findUnique.mockResolvedValue({
      id: 'b1',
      ownerId: 'u1',
      isDefault: true,
      _count: { notes: 0 },
    });

    await expect(service.remove('b1', 'u1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws ForbiddenException when deleting another users binder', async () => {
    prisma.binder.findUnique.mockResolvedValue({
      id: 'b1',
      ownerId: 'other-user',
    });

    await expect(service.remove('b1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('deletes non-default binder owned by user', async () => {
    prisma.binder.findUnique.mockResolvedValue({
      id: 'b1',
      ownerId: 'u1',
      isDefault: false,
      _count: { notes: 0 },
    });

    await service.remove('b1', 'u1');

    expect(prisma.binder.delete).toHaveBeenCalledWith({
      where: { id: 'b1' },
    });
  });

  // --- findPublicById ---

  it('returns public binder with owner and counts', async () => {
    const binder = {
      id: 'b1',
      visibility: 'PUBLIC',
      _count: { notes: 3, followers: 10 },
      owner: { id: 'u1', displayName: 'Alice', avatarUrl: null },
    };
    prisma.binder.findUnique.mockResolvedValue(binder);

    const result = await service.findPublicById('b1');
    expect(result).toEqual(binder);
  });

  it('throws ForbiddenException for private binder via findPublicById', async () => {
    prisma.binder.findUnique.mockResolvedValue({
      id: 'b1',
      visibility: 'PRIVATE',
    });

    await expect(service.findPublicById('b1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  // --- findPublicByOwner ---

  it('returns only public binders for owner', async () => {
    const binders = [
      { id: 'b1', visibility: 'PUBLIC', _count: { notes: 2, followers: 5 } },
    ];
    prisma.binder.findMany.mockResolvedValue(binders);

    const result = await service.findPublicByOwner('u1');

    expect(result).toEqual(binders);
    expect(prisma.binder.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'u1', visibility: 'PUBLIC' },
      include: { _count: { select: { notes: true, followers: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  });
});
