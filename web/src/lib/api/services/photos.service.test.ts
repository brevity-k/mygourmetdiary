import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockCreateSignedUploadUrl,
  mockCreateSignedUrl,
  mockCreateSignedUrls,
  mockStorageRemove,
  mockStorageFrom,
} = vi.hoisted(() => {
  const mockCreateSignedUploadUrl = vi.fn();
  const mockCreateSignedUrl = vi.fn();
  const mockCreateSignedUrls = vi.fn();
  const mockStorageRemove = vi.fn();
  const mockStorageFrom = vi.fn(() => ({
    createSignedUploadUrl: mockCreateSignedUploadUrl,
    createSignedUrl: mockCreateSignedUrl,
    createSignedUrls: mockCreateSignedUrls,
    remove: mockStorageRemove,
  }));
  return {
    mockCreateSignedUploadUrl,
    mockCreateSignedUrl,
    mockCreateSignedUrls,
    mockStorageRemove,
    mockStorageFrom,
  };
});

vi.mock('../clients/prisma', () => ({
  prisma: {
    photo: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('../clients/supabase-server', () => ({
  supabaseAdmin: {
    storage: {
      from: mockStorageFrom,
    },
  },
}));

import { photosService } from './photos.service';
import { prisma } from '../clients/prisma';

const mockPhotoCreate = prisma.photo.create as ReturnType<typeof vi.fn>;
const mockPhotoFindUnique = prisma.photo.findUnique as ReturnType<typeof vi.fn>;
const mockPhotoFindMany = prisma.photo.findMany as ReturnType<typeof vi.fn>;
const mockPhotoDelete = prisma.photo.delete as ReturnType<typeof vi.fn>;
const mockPhotoDeleteMany = prisma.photo.deleteMany as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
});

describe('photosService.presign', () => {
  const setupPresignMocks = () => {
    mockCreateSignedUploadUrl.mockResolvedValueOnce({
      data: { signedUrl: 'https://upload.url', token: 'upload-token' },
      error: null,
    });
    mockCreateSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: 'https://read.url/token' },
      error: null,
    });
    mockPhotoCreate.mockImplementationOnce(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 'photo-1', ...data }),
    );
  };

  it('creates correct file extension for image/jpeg -> .jpg', async () => {
    setupPresignMocks();
    await photosService.presign('user-1', 'image/jpeg', 1024);

    expect(mockPhotoCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mimeType: 'image/jpeg',
        r2Key: expect.stringMatching(/^user-1\/.*\.jpg$/),
      }),
    });
  });

  it('creates correct file extension for image/png -> .png', async () => {
    setupPresignMocks();
    await photosService.presign('user-1', 'image/png', 2048);

    expect(mockPhotoCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mimeType: 'image/png',
        r2Key: expect.stringMatching(/^user-1\/.*\.png$/),
      }),
    });
  });

  it('defaults to .jpg for unknown mime type', async () => {
    setupPresignMocks();
    await photosService.presign('user-1', 'image/bmp', 512);

    expect(mockPhotoCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mimeType: 'image/bmp',
        r2Key: expect.stringMatching(/^user-1\/.*\.jpg$/),
      }),
    });
  });

  it('throws when supabase storage returns an error', async () => {
    mockCreateSignedUploadUrl.mockResolvedValueOnce({
      data: null,
      error: { message: 'Storage error' },
    });

    await expect(photosService.presign('user-1', 'image/jpeg', 1024)).rejects.toThrow(
      'Failed to create upload URL: Storage error',
    );
  });
});

describe('photosService.remove', () => {
  it('throws "Photo not found" for missing photo', async () => {
    mockPhotoFindUnique.mockResolvedValueOnce(null);
    await expect(photosService.remove('non-existent', 'user-1')).rejects.toThrow(
      'Photo not found',
    );
  });

  it('throws "Forbidden" when uploaderId does not match userId', async () => {
    mockPhotoFindUnique.mockResolvedValueOnce({
      id: 'photo-1',
      uploaderId: 'other-user',
      r2Key: 'other-user/abc.jpg',
    });
    await expect(photosService.remove('photo-1', 'user-1')).rejects.toThrow('Forbidden');
  });

  it('deletes from storage and database when authorized', async () => {
    mockPhotoFindUnique.mockResolvedValueOnce({
      id: 'photo-1',
      uploaderId: 'user-1',
      r2Key: 'user-1/abc.jpg',
    });
    mockStorageRemove.mockResolvedValueOnce({});
    mockPhotoDelete.mockResolvedValueOnce({});

    await photosService.remove('photo-1', 'user-1');

    expect(mockStorageFrom).toHaveBeenCalledWith('photos');
    expect(mockStorageRemove).toHaveBeenCalledWith(['user-1/abc.jpg']);
    expect(mockPhotoDelete).toHaveBeenCalledWith({ where: { id: 'photo-1' } });
  });
});

describe('photosService.cleanupOrphans', () => {
  it('returns 0 when no orphans found', async () => {
    mockPhotoFindMany.mockResolvedValueOnce([]);
    const count = await photosService.cleanupOrphans();
    expect(count).toBe(0);
    expect(mockPhotoDeleteMany).not.toHaveBeenCalled();
  });

  it('deletes orphaned photos from storage and database', async () => {
    const orphans = [
      { id: 'orphan-1', r2Key: 'user-1/orphan1.jpg' },
      { id: 'orphan-2', r2Key: 'user-2/orphan2.png' },
    ];
    mockPhotoFindMany.mockResolvedValueOnce(orphans);
    mockStorageRemove.mockResolvedValue({});
    mockPhotoDeleteMany.mockResolvedValueOnce({ count: 2 });

    const count = await photosService.cleanupOrphans();

    expect(count).toBe(2);
    expect(mockStorageRemove).toHaveBeenCalledTimes(2);
    expect(mockPhotoDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['orphan-1', 'orphan-2'] } },
    });
  });
});
