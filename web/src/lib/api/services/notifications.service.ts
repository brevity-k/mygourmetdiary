import { prisma } from '../clients/prisma';

interface ExpoPushMessage {
  to: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
}

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

async function sendPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  try {
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
      signal: AbortSignal.timeout(10000),
    });

    const result = await response.json();

    // Log errors, but don't throw — push is fire-and-forget
    if (result.data && Array.isArray(result.data)) {
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i];
        if (ticket.status === 'error') {
          console.warn(
            `Push failed for ${messages[i].to}: ${ticket.message} (${ticket.details?.error})`,
          );
        }
      }
    }
  } catch (error) {
    console.error('Expo push request failed', error);
  }
}

export const notificationsService = {
  // ─── Token Management ────────────────────────────────

  async registerToken(userId: string, token: string, platform: string) {
    return prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  },

  async removeTokensForUser(userId: string) {
    await prisma.pushToken.deleteMany({ where: { userId } });
  },

  // ─── Preference Management ───────────────────────────

  async getPreferences(userId: string) {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId },
      });
    }
    return {
      newNoteInFollowed: prefs.newNoteInFollowed,
      signalOnMyNote: prefs.signalOnMyNote,
      newGourmetFriend: prefs.newGourmetFriend,
      pioneerAlert: prefs.pioneerAlert,
    };
  },

  async updatePreferences(
    userId: string,
    data: {
      newNoteInFollowed?: boolean;
      signalOnMyNote?: boolean;
      newGourmetFriend?: boolean;
      pioneerAlert?: boolean;
    },
  ) {
    const prefs = await prisma.notificationPreference.upsert({
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
  },

  // ─── Notification Triggers ───────────────────────────

  async notifyNewNoteInBinder(
    authorName: string,
    binderName: string,
    binderId: string,
    authorId: string,
  ) {
    const follows = await prisma.binderFollow.findMany({
      where: { binderId },
      select: { followerId: true },
    });

    const followerIds = follows
      .map((f: { followerId: string }) => f.followerId)
      .filter((id: string) => id !== authorId);

    if (followerIds.length === 0) return;

    await sendToUsers(
      followerIds,
      'newNoteInFollowed',
      `New note from ${authorName}`,
      `New note in "${binderName}"`,
      { type: 'new_note', binderId },
    );
  },

  async notifySignalOnNote(
    senderName: string,
    signalType: string,
    itemName: string,
    noteAuthorId: string,
    noteId: string,
  ) {
    const action = signalType === 'BOOKMARKED' ? 'bookmarked' : signalType === 'ECHOED' ? 'echoed' : 'diverged';
    await sendToUsers(
      [noteAuthorId],
      'signalOnMyNote',
      `${senderName} ${action} your note`,
      `Your note about "${itemName}"`,
      { type: 'signal', noteId },
    );
  },

  async notifyNewGourmetFriend(
    pinnerName: string,
    pinnedUserId: string,
    pinnerId: string,
  ) {
    await sendToUsers(
      [pinnedUserId],
      'newGourmetFriend',
      `${pinnerName} pinned you as a Gourmet Friend`,
      'Your taste profiles align!',
      { type: 'friend_pin', userId: pinnerId },
    );
  },

  async notifyPioneerBadge(
    userId: string,
    venueName: string,
    venueId: string,
  ) {
    await sendToUsers(
      [userId],
      'pioneerAlert',
      'Pioneer badge earned!',
      `You pioneered "${venueName}"`,
      { type: 'pioneer', venueId },
    );
  },
};

// ─── Internal ────────────────────────────────────────

type PrefKey = 'newNoteInFollowed' | 'signalOnMyNote' | 'newGourmetFriend' | 'pioneerAlert';

async function sendToUsers(
  userIds: string[],
  prefKey: PrefKey,
  title: string,
  body: string,
  data: Record<string, unknown>,
) {
  if (userIds.length === 0) return;

  // Check preferences
  const prefs = await prisma.notificationPreference.findMany({
    where: {
      userId: { in: userIds },
      [prefKey]: true,
    },
    select: { userId: true },
  });

  // Users without preferences row default to true (include them)
  const prefsMap = new Set(prefs.map((p: { userId: string }) => p.userId));
  const usersWithPrefs = await prisma.notificationPreference.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true },
  });
  const usersWithPrefsSet = new Set(usersWithPrefs.map((u: { userId: string }) => u.userId));

  const enabledUserIds = userIds.filter(
    (id) => !usersWithPrefsSet.has(id) || prefsMap.has(id),
  );

  if (enabledUserIds.length === 0) return;

  // Get push tokens
  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: enabledUserIds } },
    select: { token: true },
  });

  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((t: { token: string }) => ({
    to: t.token,
    title,
    body,
    data,
    sound: 'default' as const,
  }));

  // Fire-and-forget
  sendPushNotifications(messages).catch((e) => {
    console.error('Failed to send push notifications', e);
  });
}
