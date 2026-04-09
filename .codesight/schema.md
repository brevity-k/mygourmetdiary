# Schema

### User
- id: String (pk, default)
- supabaseId: String (unique, fk)
- email: String (unique)
- displayName: String
- avatarUrl: String (nullable)
- subscriptionTier: SubscriptionTier (default)
- rcCustomerId: String (nullable, fk)
- subscriptionExpiresAt: DateTime (nullable)
- notificationPreference: NotificationPreference (nullable)
- _relations_: binders: Binder[], notes: Note[], photos: Photo[], binderFollows: BinderFollow[], tasteSignalsSent: TasteSignal[], tasteSimilaritiesA: TasteSimilarity[], tasteSimilaritiesB: TasteSimilarity[], gourmetFriendPins: GourmetFriendPin[], gourmetPinnedBy: GourmetFriendPin[], pushTokens: PushToken[], pioneerBadges: PioneerBadge[]

### Binder
- id: String (pk, default)
- ownerId: String (fk)
- name: String
- description: String (nullable)
- category: BinderCategory
- visibility: Visibility (default)
- coverUrl: String (nullable)
- isDefault: Boolean (default)
- _relations_: owner: User, notes: Note[], followers: BinderFollow[]

### Note
- id: String (pk, default)
- authorId: String (fk)
- binderId: String (fk)
- type: NoteType
- title: String
- rating: Int
- freeText: String (nullable)
- visibility: Visibility (default)
- extension: Json (default)
- venueId: String (nullable, fk)
- experiencedAt: DateTime
- _relations_: tagIds: String[], author: User, binder: Binder, venue: Venue?, photos: Photo[], tasteSignals: TasteSignal[]

### Photo
- id: String (pk, default)
- noteId: String (nullable, fk)
- uploaderId: String (fk)
- r2Key: String
- publicUrl: String
- mimeType: String
- sizeBytes: Int
- sortOrder: Int (default)
- _relations_: note: Note?, uploader: User

### Venue
- id: String (pk, default)
- placeId: String (unique, fk)
- name: String
- address: String (nullable)
- lat: Float (nullable)
- lng: Float (nullable)
- phone: String (nullable)
- website: String (nullable)
- googleRating: Float (nullable)
- priceLevel: Int (nullable)
- hours: Json (nullable)
- lastFetchedAt: DateTime (default)
- _relations_: types: String[], notes: Note[], pioneerBadges: PioneerBadge[]

### TagTaxonomy
- id: String (pk, default)
- category: TagCategory
- name: String
- group: String
- emoji: String (nullable)

### BinderFollow
- id: String (pk, default)
- followerId: String (fk)
- binderId: String (fk)
- _relations_: follower: User, binder: Binder

### TasteSignal
- id: String (pk, default)
- senderId: String (fk)
- noteId: String (fk)
- signalType: SignalType
- senderRating: Int (nullable)
- _relations_: sender: User, note: Note

### TasteSimilarity
- id: String (pk, default)
- userAId: String (fk)
- userBId: String (fk)
- category: TasteCategory
- score: Float
- overlapCount: Int
- lastComputedAt: DateTime
- _relations_: userA: User, userB: User

### GourmetFriendPin
- id: String (pk, default)
- pinnerId: String (fk)
- pinnedId: String (fk)
- _relations_: categories: TasteCategory[], pinner: User, pinned: User

### PushToken
- id: String (pk, default)
- userId: String (fk)
- token: String (unique)
- platform: String
- _relations_: user: User

### NotificationPreference
- id: String (pk, default)
- userId: String (unique, fk)
- newNoteInFollowed: Boolean (default)
- signalOnMyNote: Boolean (default)
- newGourmetFriend: Boolean (default)
- pioneerAlert: Boolean (default)
- _relations_: user: User

### PioneerBadge
- id: String (pk, default)
- userId: String (fk)
- venueId: String (fk)
- awardedAt: DateTime (default)
- _relations_: user: User, venue: Venue

### enum BinderCategory: RESTAURANT | WINE | SPIRIT | MIXED

### enum Visibility: PUBLIC | PRIVATE

### enum NoteType: RESTAURANT | WINE | SPIRIT | WINERY_VISIT

### enum TagCategory: RESTAURANT | WINE | SPIRIT | CUISINE

### enum SignalType: BOOKMARKED | ECHOED | DIVERGED

### enum TasteCategory: RESTAURANT | WINE | SPIRIT

### enum SubscriptionTier: FREE | CONNOISSEUR
