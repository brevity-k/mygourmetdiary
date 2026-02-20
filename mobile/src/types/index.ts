// ─── Enums ──────────────────────────────────────────────

export enum NoteType {
  RESTAURANT = 'RESTAURANT',
  WINE = 'WINE',
  SPIRIT = 'SPIRIT',
  WINERY_VISIT = 'WINERY_VISIT',
}

export enum BinderCategory {
  RESTAURANT = 'RESTAURANT',
  WINE = 'WINE',
  SPIRIT = 'SPIRIT',
  MIXED = 'MIXED',
}

export enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum DishCategory {
  APPETIZER = 'APPETIZER',
  MAIN = 'MAIN',
  DESSERT = 'DESSERT',
  SIDE = 'SIDE',
  DRINK = 'DRINK',
  OTHER = 'OTHER',
}

export enum PortionSize {
  SMALL = 'SMALL',
  ADEQUATE = 'ADEQUATE',
  GENEROUS = 'GENEROUS',
}

export enum WineType {
  RED = 'RED',
  WHITE = 'WHITE',
  ROSE = 'ROSE',
  SPARKLING = 'SPARKLING',
  ORANGE = 'ORANGE',
  DESSERT = 'DESSERT',
}

export enum WineFinish {
  SHORT = 'SHORT',
  MEDIUM = 'MEDIUM',
  LONG = 'LONG',
}

export enum SpiritType {
  WHISKEY = 'WHISKEY',
  SAKE = 'SAKE',
  TEQUILA = 'TEQUILA',
  RUM = 'RUM',
  GIN = 'GIN',
  BRANDY = 'BRANDY',
  VODKA = 'VODKA',
  OTHER = 'OTHER',
}

export enum ServingMethod {
  NEAT = 'NEAT',
  ON_ROCKS = 'ON_ROCKS',
  COCKTAIL = 'COCKTAIL',
  WARM = 'WARM',
  OTHER = 'OTHER',
}

export enum PurchaseContext {
  RESTAURANT = 'RESTAURANT',
  WINE_SHOP = 'WINE_SHOP',
  WINERY = 'WINERY',
  ONLINE = 'ONLINE',
}

export enum TasteSignalType {
  BOOKMARKED = 'BOOKMARKED',
  ECHOED = 'ECHOED',
  DIVERGED = 'DIVERGED',
}

export enum TasteCategory {
  RESTAURANT = 'RESTAURANT',
  WINE = 'WINE',
  SPIRIT = 'SPIRIT',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  CONNOISSEUR = 'CONNOISSEUR',
}

// ─── Models ─────────────────────────────────────────────

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Binder {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  category: BinderCategory;
  visibility: Visibility;
  coverUrl: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { notes: number };
}

export interface PublicBinder extends Binder {
  owner?: PublicUser;
  _count?: { notes: number; followers: number };
  isFollowing?: boolean;
}

export interface Photo {
  id: string;
  noteId: string | null;
  publicUrl: string;
  mimeType: string;
  sortOrder: number;
}

export interface Venue {
  id: string;
  placeId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  googleRating: number | null;
  priceLevel: number | null;
  types: string[];
}

export interface Note {
  id: string;
  authorId: string;
  binderId: string;
  type: NoteType;
  title: string;
  rating: number;
  freeText: string | null;
  visibility: Visibility;
  tagIds: string[];
  extension: Record<string, any>;
  venueId: string | null;
  experiencedAt: string;
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
  venue: Venue | null;
}

export interface SocialNote extends Note {
  author?: PublicUser;
  signalSummary?: TasteSignalSummary;
  tier?: number;
}

export interface Tag {
  id: string;
  category: string;
  name: string;
  group: string;
  emoji: string | null;
}

export interface TasteSimilarity {
  category: TasteCategory;
  score: number | null;
  overlapCount: number;
}

export interface GourmetFriend {
  id: string;
  pinnedId: string;
  pinned: PublicUser;
  categories: TasteCategory[];
  createdAt: string;
  similarities: TasteSimilarity[];
}

export interface TasteSignal {
  id: string;
  senderId: string;
  noteId: string;
  signalType: TasteSignalType;
  senderRating: number | null;
  createdAt: string;
}

export interface TasteSignalSummary {
  bookmarkCount: number;
  echoCount: number;
  divergeCount: number;
  mySignals: TasteSignalType[];
}

export interface UserSuggestion {
  user: PublicUser;
  bestCategory: TasteCategory;
  bestScore: number;
  sharedItemCount: number;
  similarities: TasteSimilarity[];
}

export interface PublicProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  stats: { publicNoteCount: number; publicBinderCount: number };
  publicBinders: PublicBinder[];
  tasteSimilarity: TasteSimilarity[];
  isPinned: boolean;
}

export interface CanPinResult {
  canPin: boolean;
  eligibleCategories: TasteCategory[];
  compatibility: TasteSimilarity[];
}

export interface TieredSearchResult {
  tier1: (SocialNote & { tier: number })[];
  tier2: (SocialNote & { tier: number })[];
  tier3: (SocialNote & { tier: number })[];
  tier4: (SocialNote & { tier: number })[];
}

// ─── Extensions ─────────────────────────────────────────

export interface RestaurantExtension {
  dishName: string;
  dishCategory: DishCategory;
  wouldOrderAgain: boolean;
  pricePaid?: number;
  portionSize?: PortionSize;
  cuisineTags?: string[];
}

export interface WineExtension {
  wineName: string;
  vintage?: number;
  grapeVarietal?: string[];
  region?: string;
  wineType: WineType;
  noseTags?: string[];
  palateTags?: string[];
  finish?: WineFinish;
  pricePaid?: number;
  pairingNotes?: string;
  purchaseContext?: PurchaseContext;
}

export interface SpiritExtension {
  spiritName: string;
  spiritType: SpiritType;
  subType?: string;
  distillery?: string;
  ageStatement?: string;
  abv?: number;
  noseTags?: string[];
  palateTags?: string[];
  finishTags?: string[];
  servingMethod?: ServingMethod;
  pricePaid?: number;
}

export interface WineryVisitExtension {
  ambianceRating?: number;
  serviceRating?: number;
  wouldRevisit: boolean;
  reservationRequired?: boolean;
  tastingFlightNoteIds?: string[];
}

// ─── API Response ───────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PresignResponse {
  uploadUrl: string;
  photo: Photo;
}

export interface SearchResult {
  hits: Note[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Phase 3: Advisor Types ────────────────────────────

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  expiresAt: string | null;
  isActive: boolean;
}

export interface MenuDeciderDish {
  dishName: string;
  dishCategory: string;
  friendCount: number;
  matchedCount: number;
  totalCount: number;
  avgFriendRating: number | null;
  avgOverallRating: number;
  wouldOrderAgainPct: number;
  topFriendNotes: Array<{
    authorName: string;
    authorAvatar: string | null;
    rating: number;
    freeText: string | null;
    tier: 1 | 2;
  }>;
}

export interface MenuDeciderResponse {
  venue: { id: string; name: string; address: string | null };
  dishes: MenuDeciderDish[];
  hasFriendData: boolean;
}

export interface MapPin {
  venue: Venue;
  noteCount: number;
  myNoteCount: number;
  friendNoteCount: number;
  avgRating: number | null;
  avgFriendRating: number | null;
  topFriendNames: string[];
  category: 'RESTAURANT' | 'WINERY_VISIT';
}

export interface NotificationPreferences {
  newNoteInFollowed: boolean;
  signalOnMyNote: boolean;
  newGourmetFriend: boolean;
  pioneerAlert: boolean;
}

export interface PioneerBadge {
  id: string;
  venueId: string;
  venue?: Venue;
  awardedAt: string;
}

export interface PioneerZone {
  venue: Venue;
  noteCount: number;
}
