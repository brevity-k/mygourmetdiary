import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const PIONEER_NOTE_THRESHOLD = 3; // Venues with < 3 notes are pioneer zones
const PIONEER_BADGE_MAX = 5; // First 5 users get badge
const MIN_PHOTOS = 1;
const MIN_EXTENSION_FIELDS = 3;

@Injectable()
export class PioneersService {
  private readonly logger = new Logger(PioneersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getPioneerZones(lat: number, lng: number, radiusKm: number) {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    // Get all venues in radius
    const venues = await this.prisma.venue.findMany({
      where: {
        lat: { gte: lat - latDelta, lte: lat + latDelta },
        lng: { gte: lng - lngDelta, lte: lng + lngDelta },
      },
    });

    if (venues.length === 0) return [];

    // Count public notes per venue
    const venueCounts = await this.prisma.note.groupBy({
      by: ['venueId'],
      where: {
        venueId: { in: venues.map((v) => v.id) },
        visibility: 'PUBLIC',
      },
      _count: true,
    });

    const countMap = new Map(venueCounts.map((vc) => [vc.venueId, vc._count]));

    // Filter to pioneer zones (< threshold notes)
    return venues
      .filter((v) => (countMap.get(v.id) ?? 0) < PIONEER_NOTE_THRESHOLD)
      .map((v) => ({
        venue: {
          id: v.id,
          placeId: v.placeId,
          name: v.name,
          address: v.address,
          lat: v.lat,
          lng: v.lng,
        },
        noteCount: countMap.get(v.id) ?? 0,
      }));
  }

  async getUserBadges(userId: string) {
    return this.prisma.pioneerBadge.findMany({
      where: { userId },
      include: {
        venue: {
          select: { id: true, name: true, address: true },
        },
      },
      orderBy: { awardedAt: 'desc' },
    });
  }

  async checkAndAwardPioneerBadge(userId: string, noteId: string) {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      include: {
        photos: true,
        venue: true,
      },
    });

    if (!note || !note.venueId || note.visibility !== 'PUBLIC') return;

    // Check venue note count
    const noteCount = await this.prisma.note.count({
      where: { venueId: note.venueId, visibility: 'PUBLIC' },
    });

    if (noteCount > PIONEER_BADGE_MAX) return;

    // Quality gate: at least 1 photo + 3 filled extension fields
    if (note.photos.length < MIN_PHOTOS) return;

    const ext = note.extension as Record<string, unknown>;
    const filledFields = Object.values(ext).filter(
      (v) => v !== null && v !== undefined && v !== '',
    ).length;
    if (filledFields < MIN_EXTENSION_FIELDS) return;

    // Check if user already has badge for this venue
    const existing = await this.prisma.pioneerBadge.findUnique({
      where: { userId_venueId: { userId, venueId: note.venueId } },
    });
    if (existing) return;

    // Award badge
    await this.prisma.pioneerBadge.create({
      data: { userId, venueId: note.venueId },
    });

    this.logger.log(`Pioneer badge awarded to user ${userId} for venue ${note.venueId}`);

    // Notify user
    this.notificationsService
      .notifyPioneerBadge(userId, note.venue?.name ?? 'a venue', note.venueId)
      .catch(() => {});
  }
}
