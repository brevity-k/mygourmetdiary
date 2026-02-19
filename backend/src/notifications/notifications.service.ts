import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpoPushClient, ExpoPushMessage } from './expo-push.client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushClient: ExpoPushClient,
  ) {}

  // ─── Token Management ────────────────────────────────

  async registerToken(userId: string, token: string, platform: string) {
    return this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  }

  async removeTokensForUser(userId: string) {
    await this.prisma.pushToken.deleteMany({ where: { userId } });
  }

  // ─── Preference Management ───────────────────────────

  async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }
    return {
      newNoteInFollowed: prefs.newNoteInFollowed,
      signalOnMyNote: prefs.signalOnMyNote,
      newGourmetFriend: prefs.newGourmetFriend,
      pioneerAlert: prefs.pioneerAlert,
    };
  }

  async updatePreferences(
    userId: string,
    data: {
      newNoteInFollowed?: boolean;
      signalOnMyNote?: boolean;
      newGourmetFriend?: boolean;
      pioneerAlert?: boolean;
    },
  ) {
    const prefs = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return {
      newNoteInFollowed: prefs.newNoteInFollowed,
      signalOnMyNote: prefs.signalOnMyNote,
      newGourmetFriend: prefs.newGourmetFriend,
      pioneerAlert: prefs.pioneerAlert,
    };
  }

  // ─── Notification Triggers ───────────────────────────

  async notifyNewNoteInBinder(
    authorName: string,
    binderName: string,
    binderId: string,
    authorId: string,
  ) {
    // Find all followers of this binder
    const follows = await this.prisma.binderFollow.findMany({
      where: { binderId },
      select: { followerId: true },
    });

    const followerIds = follows
      .map((f) => f.followerId)
      .filter((id) => id !== authorId);

    if (followerIds.length === 0) return;

    await this.sendToUsers(
      followerIds,
      'newNoteInFollowed',
      `New note from ${authorName}`,
      `New note in "${binderName}"`,
      { type: 'new_note', binderId },
    );
  }

  async notifySignalOnNote(
    senderName: string,
    signalType: string,
    itemName: string,
    noteAuthorId: string,
    noteId: string,
  ) {
    const action = signalType === 'BOOKMARKED' ? 'bookmarked' : signalType === 'ECHOED' ? 'echoed' : 'diverged';
    await this.sendToUsers(
      [noteAuthorId],
      'signalOnMyNote',
      `${senderName} ${action} your note`,
      `Your note about "${itemName}"`,
      { type: 'signal', noteId },
    );
  }

  async notifyNewGourmetFriend(
    pinnerName: string,
    pinnedUserId: string,
    pinnerId: string,
  ) {
    await this.sendToUsers(
      [pinnedUserId],
      'newGourmetFriend',
      `${pinnerName} pinned you as a Gourmet Friend`,
      'Your taste profiles align!',
      { type: 'friend_pin', userId: pinnerId },
    );
  }

  async notifyPioneerBadge(
    userId: string,
    venueName: string,
    venueId: string,
  ) {
    await this.sendToUsers(
      [userId],
      'pioneerAlert',
      'Pioneer badge earned!',
      `You pioneered "${venueName}"`,
      { type: 'pioneer', venueId },
    );
  }

  // ─── Internal ────────────────────────────────────────

  private async sendToUsers(
    userIds: string[],
    prefKey: 'newNoteInFollowed' | 'signalOnMyNote' | 'newGourmetFriend' | 'pioneerAlert',
    title: string,
    body: string,
    data: Record<string, unknown>,
  ) {
    if (userIds.length === 0) return;

    // Check preferences
    const prefs = await this.prisma.notificationPreference.findMany({
      where: {
        userId: { in: userIds },
        [prefKey]: true,
      },
      select: { userId: true },
    });

    // Users without preferences row default to true (include them)
    const prefsMap = new Set(prefs.map((p) => p.userId));
    const usersWithPrefs = await this.prisma.notificationPreference.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true },
    });
    const usersWithPrefsSet = new Set(usersWithPrefs.map((u) => u.userId));

    const enabledUserIds = userIds.filter(
      (id) => !usersWithPrefsSet.has(id) || prefsMap.has(id),
    );

    if (enabledUserIds.length === 0) return;

    // Get push tokens
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId: { in: enabledUserIds } },
      select: { token: true },
    });

    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data,
      sound: 'default' as const,
    }));

    // Fire-and-forget
    this.pushClient.sendPushNotifications(messages).catch((e) => {
      this.logger.error('Failed to send push notifications', e);
    });
  }
}
