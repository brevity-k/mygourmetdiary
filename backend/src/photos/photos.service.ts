import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuid } from 'uuid';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    this.bucket = this.configService.get<string>('R2_BUCKET_NAME') || '';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async presign(
    uploaderId: string,
    mimeType: string,
    sizeBytes: number,
  ) {
    if (!ALLOWED_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      );
    }

    if (sizeBytes > MAX_SIZE) {
      throw new BadRequestException('File too large. Max 10MB.');
    }

    const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
    const key = `photos/${uploaderId}/${uuid()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      ContentLength: sizeBytes,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 600, // 10 minutes
    });

    const photo = await this.prisma.photo.create({
      data: {
        uploaderId,
        r2Key: key,
        publicUrl: `${this.publicUrl}/${key}`,
        mimeType,
        sizeBytes,
      },
    });

    return { uploadUrl, photo };
  }

  async remove(id: string, userId: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Photo not found');
    if (photo.uploaderId !== userId) throw new ForbiddenException();

    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: photo.r2Key }),
    );

    await this.prisma.photo.delete({ where: { id } });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanOrphans() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const orphans = await this.prisma.photo.findMany({
      where: {
        noteId: null,
        createdAt: { lt: oneHourAgo },
      },
    });

    if (orphans.length === 0) return;

    this.logger.log(`Cleaning ${orphans.length} orphaned photos`);

    for (const photo of orphans) {
      try {
        await this.s3.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: photo.r2Key }),
        );
      } catch (e) {
        this.logger.error(`Failed to delete R2 object ${photo.r2Key}`, e);
      }
    }

    await this.prisma.photo.deleteMany({
      where: { id: { in: orphans.map((p) => p.id) } },
    });
  }
}
