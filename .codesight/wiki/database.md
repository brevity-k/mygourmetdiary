# Database

> **Navigation aid.** Schema shapes and field types extracted via AST. Read the actual schema source files before writing migrations or query logic.

**prisma** — 20 models

### User

pk: `id` (String) · fk: supabaseId, rcCustomerId

- `id`: String _(pk, default)_
- `supabaseId`: String _(unique, fk)_
- `email`: String _(unique)_
- `displayName`: String
- `avatarUrl`: String _(nullable)_
- `subscriptionTier`: SubscriptionTier _(default)_
- `rcCustomerId`: String _(nullable, fk)_
- `subscriptionExpiresAt`: DateTime _(nullable)_
- `notificationPreference`: NotificationPreference _(nullable)_
- _relations_: binders: Binder[], notes: Note[], photos: Photo[], binderFollows: BinderFollow[], tasteSignalsSent: TasteSignal[], tasteSimilaritiesA: TasteSimilarity[], tasteSimilaritiesB: TasteSimilarity[], gourmetFriendPins: GourmetFriendPin[], gourmetPinnedBy: GourmetFriendPin[], pushTokens: PushToken[], pioneerBadges: PioneerBadge[]

### Binder

pk: `id` (String) · fk: ownerId

- `id`: String _(pk, default)_
- `ownerId`: String _(fk)_
- `name`: String
- `description`: String _(nullable)_
- `category`: BinderCategory
- `visibility`: Visibility _(default)_
- `coverUrl`: String _(nullable)_
- `isDefault`: Boolean _(default)_
- _relations_: owner: User, notes: Note[], followers: BinderFollow[]

### Note

pk: `id` (String) · fk: authorId, binderId, venueId

- `id`: String _(pk, default)_
- `authorId`: String _(fk)_
- `binderId`: String _(fk)_
- `type`: NoteType
- `title`: String
- `rating`: Int
- `freeText`: String _(nullable)_
- `visibility`: Visibility _(default)_
- `extension`: Json _(default)_
- `venueId`: String _(nullable, fk)_
- `experiencedAt`: DateTime
- _relations_: tagIds: String[], author: User, binder: Binder, venue: Venue?, photos: Photo[], tasteSignals: TasteSignal[]

### Photo

pk: `id` (String) · fk: noteId, uploaderId

- `id`: String _(pk, default)_
- `noteId`: String _(nullable, fk)_
- `uploaderId`: String _(fk)_
- `r2Key`: String
- `publicUrl`: String
- `mimeType`: String
- `sizeBytes`: Int
- `sortOrder`: Int _(default)_
- _relations_: note: Note?, uploader: User

### Venue

pk: `id` (String) · fk: placeId

- `id`: String _(pk, default)_
- `placeId`: String _(unique, fk)_
- `name`: String
- `address`: String _(nullable)_
- `lat`: Float _(nullable)_
- `lng`: Float _(nullable)_
- `phone`: String _(nullable)_
- `website`: String _(nullable)_
- `googleRating`: Float _(nullable)_
- `priceLevel`: Int _(nullable)_
- `hours`: Json _(nullable)_
- `lastFetchedAt`: DateTime _(default)_
- _relations_: types: String[], notes: Note[], pioneerBadges: PioneerBadge[]

### TagTaxonomy

pk: `id` (String)

- `id`: String _(pk, default)_
- `category`: TagCategory
- `name`: String
- `group`: String
- `emoji`: String _(nullable)_

### BinderFollow

pk: `id` (String) · fk: followerId, binderId

- `id`: String _(pk, default)_
- `followerId`: String _(fk)_
- `binderId`: String _(fk)_
- _relations_: follower: User, binder: Binder

### TasteSignal

pk: `id` (String) · fk: senderId, noteId

- `id`: String _(pk, default)_
- `senderId`: String _(fk)_
- `noteId`: String _(fk)_
- `signalType`: SignalType
- `senderRating`: Int _(nullable)_
- _relations_: sender: User, note: Note

### TasteSimilarity

pk: `id` (String) · fk: userAId, userBId

- `id`: String _(pk, default)_
- `userAId`: String _(fk)_
- `userBId`: String _(fk)_
- `category`: TasteCategory
- `score`: Float
- `overlapCount`: Int
- `lastComputedAt`: DateTime
- _relations_: userA: User, userB: User

### GourmetFriendPin

pk: `id` (String) · fk: pinnerId, pinnedId

- `id`: String _(pk, default)_
- `pinnerId`: String _(fk)_
- `pinnedId`: String _(fk)_
- _relations_: categories: TasteCategory[], pinner: User, pinned: User

### PushToken

pk: `id` (String) · fk: userId

- `id`: String _(pk, default)_
- `userId`: String _(fk)_
- `token`: String _(unique)_
- `platform`: String
- _relations_: user: User

### NotificationPreference

pk: `id` (String) · fk: userId

- `id`: String _(pk, default)_
- `userId`: String _(unique, fk)_
- `newNoteInFollowed`: Boolean _(default)_
- `signalOnMyNote`: Boolean _(default)_
- `newGourmetFriend`: Boolean _(default)_
- `pioneerAlert`: Boolean _(default)_
- _relations_: user: User

### PioneerBadge

pk: `id` (String) · fk: userId, venueId

- `id`: String _(pk, default)_
- `userId`: String _(fk)_
- `venueId`: String _(fk)_
- `awardedAt`: DateTime _(default)_
- _relations_: user: User, venue: Venue

### enum BinderCategory

RESTAURANT | WINE | SPIRIT | MIXED

### enum Visibility

PUBLIC | PRIVATE

### enum NoteType

RESTAURANT | WINE | SPIRIT | WINERY_VISIT

### enum TagCategory

RESTAURANT | WINE | SPIRIT | CUISINE

### enum SignalType

BOOKMARKED | ECHOED | DIVERGED

### enum TasteCategory

RESTAURANT | WINE | SPIRIT

### enum SubscriptionTier

FREE | CONNOISSEUR

## Schema Source Files

Read and edit these files when adding columns, creating migrations, or changing relations:

- `web/src/lib/api/clients/prisma.ts` — imported by **20** files
- `backend/prisma/generated/client/enums.ts` — imported by **19** files
- `backend/prisma/generated/client/internal/prismaNamespace.ts` — imported by **17** files

---
_Back to [overview.md](./overview.md)_