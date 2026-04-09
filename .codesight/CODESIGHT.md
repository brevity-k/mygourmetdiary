# mygourmetdiary — AI Context Map

> **Stack:** next-app | prisma | react | typescript
> **Monorepo:** mobile, web, @mygourmetdiary/shared-api, @mygourmetdiary/shared-constants, @mygourmetdiary/shared-types

> 3 routes | 20 models | 103 components | 96 lib files | 39 env vars | 4 middleware | 25% test coverage
> **Token savings:** this file is ~10,200 tokens. Without it, AI exploration would cost ~80,300 tokens. **Saves ~70,100 tokens per conversation.**

---

# Routes

- `POST` `/api/v1/auth/register` [auth, db]
- `GET` `/api/v1/health` [db]
- `POST` `/api/v1/subscriptions/webhook` → out: { message, statusCode, timestamp } [auth, payment]

---

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

---

# Components

- **App** — `mobile/App.tsx`
- **BinderCardSkeleton** — `mobile/src/components/common/BinderCardSkeleton.tsx`
- **Chip** — props: label, selected, onPress, emoji — `mobile/src/components/common/Chip.tsx`
- **EmptyState** — props: title, description, actionLabel, onAction — `mobile/src/components/common/EmptyState.tsx`
- **LoadingSpinner** — `mobile/src/components/common/LoadingSpinner.tsx`
- **NoteCardSkeleton** — `mobile/src/components/common/NoteCardSkeleton.tsx`
- **NotificationListener** — `mobile/src/components/common/NotificationListener.tsx`
- **PioneerBadgeComponent** — props: count, compact — `mobile/src/components/common/PioneerBadge.tsx`
- **PremiumGate** — props: featureName — `mobile/src/components/common/PremiumGate.tsx`
- **SegmentControl** — props: segments, selected, onSelect — `mobile/src/components/common/SegmentControl.tsx`
- **BinderSelector** — props: binders, selectedId, onChange, label — `mobile/src/components/forms/BinderSelector.tsx`
- **DateInput** — props: label, value, onChange — `mobile/src/components/forms/DateInput.tsx`
- **PhotoPicker** — props: photos, onAdd, onRemove, maxPhotos — `mobile/src/components/forms/PhotoPicker.tsx`
- **RatingInput** — props: value, onChange, label — `mobile/src/components/forms/RatingInput.tsx`
- **TagSelector** — props: label, tags, selectedIds, onChange — `mobile/src/components/forms/TagSelector.tsx`
- **VenueSearchInput** — props: value, onChange, label — `mobile/src/components/forms/VenueSearchInput.tsx`
- **MapSearchBar** — props: mapCenter, onVenueSelect — `mobile/src/components/map/MapSearchBar.tsx`
- **VenuePreviewCard** — `mobile/src/components/map/VenuePreviewCard.tsx`
- **DishCard** — props: dish — `mobile/src/components/menu-decider/DishCard.tsx`
- **NoteCard** — props: note, onPress — `mobile/src/components/notes/NoteCard.tsx`
- **SocialNoteCard** — props: note, onPress, onAuthorPress — `mobile/src/components/notes/SocialNoteCard.tsx`
- **SearchFilterSheet** — props: noteType, onApply, onClear — `mobile/src/components/search/SearchFilterSheet.tsx`
- **FollowButton** — props: binderId, isFollowing — `mobile/src/components/social/FollowButton.tsx`
- **RatingInputModal** — props: visible, title, onSubmit, onClose — `mobile/src/components/social/RatingInputModal.tsx`
- **TasteMatchBadge** — props: category, score, overlapCount — `mobile/src/components/social/TasteMatchBadge.tsx`
- **TasteSignalButtons** — props: noteId — `mobile/src/components/social/TasteSignalButtons.tsx`
- **TierBadge** — props: tier, label — `mobile/src/components/social/TierBadge.tsx`
- **UserCard** — props: user, subtitle, rightElement, onPress — `mobile/src/components/social/UserCard.tsx`
- **AuthNavigator** — `mobile/src/navigation/AuthNavigator.tsx`
- **BindersStackNavigator** — `mobile/src/navigation/BindersStackNavigator.tsx`
- **HomeStackNavigator** — `mobile/src/navigation/HomeStackNavigator.tsx`
- **MainNavigator** — `mobile/src/navigation/MainNavigator.tsx`
- **NoteCreationNavigator** — props: onClose — `mobile/src/navigation/NoteCreationNavigator.tsx`
- **ProfileStackNavigator** — `mobile/src/navigation/ProfileStackNavigator.tsx`
- **RootNavigator** — `mobile/src/navigation/RootNavigator.tsx`
- **SearchStackNavigator** — `mobile/src/navigation/SearchStackNavigator.tsx`
- **OnboardingScreen** — `mobile/src/screens/auth/OnboardingScreen.tsx`
- **WelcomeScreen** — `mobile/src/screens/auth/WelcomeScreen.tsx`
- **BinderDetailScreen** — `mobile/src/screens/binders/BinderDetailScreen.tsx`
- **BindersScreen** — `mobile/src/screens/binders/BindersScreen.tsx`
- **FollowedBindersScreen** — `mobile/src/screens/binders/FollowedBindersScreen.tsx`
- **HomeScreen** — `mobile/src/screens/home/HomeScreen.tsx`
- **NoteDetailScreen** — `mobile/src/screens/home/NoteDetailScreen.tsx`
- **AreaExplorerScreen** — `mobile/src/screens/map/AreaExplorerScreen.tsx`
- **VenueNotesScreen** — `mobile/src/screens/map/VenueNotesScreen.tsx`
- **MenuDeciderScreen** — `mobile/src/screens/menu-decider/MenuDeciderScreen.tsx`
- **NoteTypeSelectScreen** — `mobile/src/screens/note-creation/NoteTypeSelectScreen.tsx`
- **RestaurantNoteFormScreen** — `mobile/src/screens/note-creation/RestaurantNoteFormScreen.tsx`
- **SpiritNoteFormScreen** — `mobile/src/screens/note-creation/SpiritNoteFormScreen.tsx`
- **WineNoteFormScreen** — `mobile/src/screens/note-creation/WineNoteFormScreen.tsx`
- **WineryVisitNoteFormScreen** — `mobile/src/screens/note-creation/WineryVisitNoteFormScreen.tsx`
- **PaywallScreen** — `mobile/src/screens/profile/PaywallScreen.tsx`
- **ProfileScreen** — `mobile/src/screens/profile/ProfileScreen.tsx`
- **SettingsScreen** — `mobile/src/screens/profile/SettingsScreen.tsx`
- **ExploreScreen** — `mobile/src/screens/search/ExploreScreen.tsx`
- **SearchScreen** — `mobile/src/screens/search/SearchScreen.tsx`
- **DiscoverScreen** — `mobile/src/screens/social/DiscoverScreen.tsx`
- **GourmetFriendsScreen** — `mobile/src/screens/social/GourmetFriendsScreen.tsx`
- **PinGourmetFriendScreen** — `mobile/src/screens/social/PinGourmetFriendScreen.tsx`
- **UserProfileScreen** — `mobile/src/screens/social/UserProfileScreen.tsx`
- **BinderDetailPage** [client] — props: params — `web/src/app/(app)/binders/[binderId]/page.tsx`
- **BindersPage** [client] — `web/src/app/(app)/binders/page.tsx`
- **AppError** [client] — props: error, reset — `web/src/app/(app)/error.tsx`
- **ExplorePage** [client] — `web/src/app/(app)/explore/page.tsx`
- **FeedPage** [client] — `web/src/app/(app)/feed/page.tsx`
- **AppLayout** [client] — `web/src/app/(app)/layout.tsx`
- **EditNotePage** [client] — props: params — `web/src/app/(app)/notes/[noteId]/edit/page.tsx`
- **NoteDetailPage** [client] — props: params — `web/src/app/(app)/notes/[noteId]/page.tsx`
- **NewNotePage** [client] — `web/src/app/(app)/notes/new/page.tsx`
- **NewRestaurantNotePage** [client] — `web/src/app/(app)/notes/new/restaurant/page.tsx`
- **NewSpiritNotePage** [client] — `web/src/app/(app)/notes/new/spirit/page.tsx`
- **NewWineNotePage** [client] — `web/src/app/(app)/notes/new/wine/page.tsx`
- **NewWineryVisitNotePage** [client] — `web/src/app/(app)/notes/new/winery-visit/page.tsx`
- **ProfilePage** [client] — `web/src/app/(app)/profile/page.tsx`
- **SearchPage** [client] — `web/src/app/(app)/search/page.tsx`
- **SettingsPage** [client] — `web/src/app/(app)/settings/page.tsx`
- **AuthError** [client] — props: error, reset — `web/src/app/(auth)/error.tsx`
- **LoginPage** [client] — `web/src/app/(auth)/login/page.tsx`
- **OnboardingPage** [client] — `web/src/app/(auth)/onboarding/page.tsx`
- **RegisterPage** [client] — `web/src/app/(auth)/register/page.tsx`
- **RootLayout** — `web/src/app/layout.tsx`
- **HomePage** [client] — `web/src/app/page.tsx`
- **AppSidebar** [client] — `web/src/components/app-sidebar.tsx`
- **AreaExplorerMap** [client] — `web/src/components/map/area-explorer-map.tsx`
- **FeedMapView** [client] — props: typeFilter, binderId — `web/src/components/map/feed-map-view.tsx`
- **GoogleMapsProvider** [client] — `web/src/components/map/google-maps-provider.tsx`
- **StaticVenueMap** [client] — props: lat, lng, venueName, noteType — `web/src/components/map/static-venue-map.tsx`
- **VenueInfoPopover** [client] — props: venue, noteCount, avgRating — `web/src/components/map/venue-info-popover.tsx`
- **VenuePreviewPanel** [client] — props: pin, onClose — `web/src/components/map/venue-preview-panel.tsx`
- **VenuePreviewBottomPanel** [client] — props: pin, onClose — `web/src/components/map/venue-preview-panel.tsx`
- **MobileNav** [client] — `web/src/components/mobile-nav.tsx`
- **NoteCard** [client] — props: note — `web/src/components/note-card.tsx`
- **NoteFeed** [client] — props: typeFilter, binderId — `web/src/components/note-feed.tsx`
- **NoteFormLayout** [client] — props: type, title, formData, venue, photos, setPhotos, updateField, handleVenueChange, onSubmit, isSubmitting — `web/src/components/note-form-layout.tsx`
- **PhotoGallery** [client] — props: photos — `web/src/components/photo-gallery.tsx`
- **PhotoUploader** [client] — props: photos, onChange, maxPhotos — `web/src/components/photo-uploader.tsx`
- **RatingDisplay** — props: rating, size — `web/src/components/rating-display.tsx`
- **RatingInput** [client] — props: value, onChange — `web/src/components/rating-input.tsx`
- **TagSelector** [client] — props: category, group, value, onChange — `web/src/components/tag-selector.tsx`
- **VenueSearch** [client] — props: value, onChange — `web/src/components/venue-search.tsx`
- **AuthProvider** [client] — `web/src/lib/auth-context.tsx`
- **ProvidersInner** [client] — `web/src/lib/providers-inner.tsx`
- **Providers** [client] — `web/src/lib/providers.tsx`

---

# Libraries

- `backend/prisma/generated/client/internal/class.ts`
  - function getPrismaClientClass: () => PrismaClientConstructor
  - interface PrismaClientConstructor
  - interface PrismaClient
  - type LogOptions
- `ios/Pods/Target Support Files/Pods-mygourmetdiary/ExpoModulesProvider.swift` — class ExpoModulesProvider
- `ios/mygourmetdiary/AppDelegate.swift` — class AppDelegate
- `mobile/ios/MyGourmetDiary/AppDelegate.swift` — class AppDelegate
- `mobile/ios/Pods/Google-Maps-iOS-Utils/Sources/GoogleMapsUtils/GeometryUtils/MapPoint.swift` — class MapPoint
- `mobile/ios/Pods/Google-Maps-iOS-Utils/Sources/GoogleMapsUtils/Heatmap/HeatmapInterpolationPoints.swift`
  - class HeatmapInterpolationPoints
  - function addWeightedLatLngs
  - function addWeightedLatLng
  - function removeAllData
  - function generatePoints
- `mobile/ios/Pods/GoogleMaps/SwiftExample/GoogleMapsSwiftXCFrameworkDemos/Swift/Samples/UIViewController+Extensions.swift` — function showToast, function promptForMapID
- `mobile/ios/Pods/PurchasesHybridCommon/ios/PurchasesHybridCommon/PurchasesHybridCommon/IOSAPIAvailabilityChecker.swift`
  - class IOSAPIAvailabilityChecker
  - function isWinBackOfferAPIAvailable
  - function isEnableAdServicesAttributionTokenCollectionAPIAvailable
  - function isCodeRedemptionSheetAPIAvailable
  - function isAdTrackingAPIAvailable
  - function isCustomPaywallTrackingAPIAvailable
- `mobile/ios/Pods/RevenueCat/Sources/Ads/AdTracker.swift` — class AdTracker
- `mobile/ios/Pods/RevenueCat/Sources/Attribution/AttributionNetwork.swift` — function encode
- `mobile/ios/Pods/RevenueCat/Sources/Caching/Checksum.swift` — class Checksum, enum Algorithm
- `mobile/ios/Pods/RevenueCat/Sources/CodableExtensions/PeriodType+Extensions.swift` — function encode
- `mobile/ios/Pods/RevenueCat/Sources/CodableExtensions/PurchaseOwnershipType+Extensions.swift` — function encode
- `mobile/ios/Pods/RevenueCat/Sources/CodableExtensions/Store+Extensions.swift` — function encode
- `mobile/ios/Pods/RevenueCat/Sources/CustomerCenter/CustomerCenterPresentationMode.swift` — enum CustomerCenterPresentationMode, function encode
- `mobile/ios/Pods/RevenueCat/Sources/CustomerCenter/Events/CustomerCenterEvent.swift` — class Data
- `mobile/ios/Pods/RevenueCat/Sources/Identity/CustomerInfo.swift` — function encode
- `mobile/ios/Pods/RevenueCat/Sources/LocalReceiptParsing/BasicTypes/AppleReceipt.swift` — class AppleReceipt, enum Environment
- `mobile/ios/Pods/RevenueCat/Sources/LocalReceiptParsing/BasicTypes/InAppPurchase.swift` — class InAppPurchase, enum ProductType
- `mobile/ios/Pods/RevenueCat/Sources/LocalReceiptParsing/PurchasesReceiptParser.swift` — class PurchasesReceiptParser, function parse
- `mobile/ios/Pods/RevenueCat/Sources/Misc/Obsoletions.swift`
  - enum RCPaymentMode
  - class PromotionalOfferEligibility
  - enum RCBackendErrorCode
  - class RCPurchasesErrorUtils
- `mobile/ios/Pods/RevenueCat/Sources/Misc/PlatformInfo.swift` — class PlatformInfo
- `mobile/ios/Pods/RevenueCat/Sources/Networking/Responses/RevenueCatUI/PaywallComponentsData.swift`
  - class PaywallComponentsData
  - class ComponentsConfig
  - class PaywallComponentsConfig
  - enum LocalizationData
  - class EquatableError
  - function encode
- `mobile/ios/Pods/RevenueCat/Sources/Networking/Responses/RevenueCatUI/UIConfig.swift`
  - class UIConfig
  - class AppConfig
  - class FontsConfig
  - class VariableConfig
  - class CustomVariableDefinition
  - class UIConfig
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/Common/Background.swift` — function encode
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/Common/ComponentOverrides.swift`
  - interface PaywallPartialComponent
  - enum ConditionValue
  - enum EqualityOperator
  - enum ArrayOperator
  - function encode
  - function toCondition
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/Common/Dimension.swift`
  - function encode
  - function horizontal
  - function vertical
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/Common/PaywallComponentBase.swift`
  - interface PaywallComponentBase
  - enum PaywallComponent
  - enum ComponentType
  - function encode
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/Common/PaywallComponentLocalization.swift` — function string, function image
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/Common/PaywallComponentPropertyTypes.swift` — function encode, function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallButtonComponent.swift`
  - enum Action
  - enum Destination
  - enum URLMethod
  - class Sheet
  - function encode
  - function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallCarouselComponent.swift`
  - class AutoAdvanceSlides
  - enum AutoAdvanceTransitionType
  - class PageControl
  - enum Position
  - class PageControlIndicator
  - function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallCountdownComponent.swift`
  - enum CountdownStyle
  - enum CountFrom
  - function encode
  - function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallIconComponent.swift` — function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallImageComponent.swift` — function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallPackageComponent.swift` — function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallPurchaseButtonComponent.swift`
  - enum Action
  - enum Method
  - class WebCheckout
  - class CustomWebCheckout
  - class CustomURL
  - function encode
  - _...1 more_
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallStackComponent.swift` — enum Overflow, function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallStickyFooterComponent.swift` — function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallTabsComponent.swift` — enum TabControlType, function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallTextComponent.swift` — function encode, function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallTimelineComponent.swift`
  - class Item
  - class Connector
  - enum IconAlignment
  - function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Components/PaywallVideoComponent.swift`
  - class VideoComponent
  - class PartialVideoComponent
  - function hash
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Events/CustomPaywallImpressionParams.swift` — class CustomPaywallImpressionParams
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/Events/PaywallEvent.swift`
  - enum ExitOfferType
  - enum PaywallEvent
  - class CreationData
  - class Data
  - class ExitOfferData
  - function withPurchaseInfo
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/ExitOffer.swift` — class ExitOffer, class ExitOffers
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/PaywallColor.swift`
  - class PaywallColor
  - enum ColorScheme
  - function hash
  - function encode
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/PaywallData.swift`
  - class PaywallData
  - interface PaywallLocalizedConfiguration
  - class ZeroDecimalPlaceCountries
  - class LocalizedConfiguration
  - class Feature
  - class OfferOverride
  - _...7 more_
- `mobile/ios/Pods/RevenueCat/Sources/Paywalls/PaywallViewMode.swift` — enum PaywallViewMode, function encode
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/Configuration.swift` — enum EntitlementVerificationMode, function with
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/NonSubscriptionTransaction.swift` — class NonSubscriptionTransaction
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/Offering.swift` — class PaywallComponents, function getMetadataValue
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/PackageType.swift` — function encode
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/Purchases/Purchases.swift`
  - function switchUser
  - function isPurchaseAllowedByRestoreBehavior
  - function overridePreferredUILocale
  - function eligibleWinBackOffers
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/StoreKit2/StoreKit2PromotionalOfferPurchaseOptions.swift` — class StoreKit2PromotionalOfferPurchaseOptions
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/StoreKitAbstractions/PromotionalOffer.swift` — class PromotionalOffer
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/StoreKitAbstractions/StoreProductDiscount.swift`
  - class StoreProductDiscount
  - enum PaymentMode
  - enum DiscountType
  - class Data
  - function encode
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/StoreKitAbstractions/Storefront.swift` — class Storefront
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/StoreKitAbstractions/SubscriptionPeriod.swift` — class SubscriptionPeriod, enum Unit
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/StoreKitAbstractions/Test Data/TestStoreProduct.swift` — class TestStoreProduct, function toStoreProduct
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/StoreKitAbstractions/Test Data/TestStoreProductDiscount.swift` — class TestStoreProductDiscount, function toStoreProductDiscount
- `mobile/ios/Pods/RevenueCat/Sources/Purchasing/StoreKitAbstractions/WinBackOffer.swift` — class WinBackOffer
- `mobile/ios/Pods/RevenueCat/Sources/Support/DebugUI/DebugViewController.swift` — class DebugViewController, function presentDebugRevenueCatOverlay
- `mobile/ios/Pods/RevenueCat/Sources/Support/PaywallExtensions.swift` — function forOffering
- `mobile/ios/Pods/RevenueCat/Sources/Support/PurchasesDiagnostics.swift`
  - class PurchasesDiagnostics
  - enum ProductStatus
  - class ProductDiagnosticsPayload
  - class InvalidBundleIdErrorPayload
  - enum SDKHealthCheckStatus
  - class OfferingDiagnosticsPayload
  - _...8 more_
- `mobile/ios/Pods/RevenueCat/Sources/Virtual Currencies/VirtualCurrency.swift` — class VirtualCurrency
- `mobile/ios/Pods/Target Support Files/Pods-MyGourmetDiary/ExpoModulesProvider.swift` — class ExpoModulesProvider
- `mobile/src/auth/supabase.ts`
  - function devSignIn: () => Promise<AuthUser>
  - function autoDevSignIn: () => void
  - function signInWithGoogle: (idToken) => Promise<AuthUser>
  - function signInWithApple: (identityToken, nonce) => Promise<AuthUser>
  - function signOut: () => Promise<void>
  - function getIdToken: () => Promise<string | null>
  - _...2 more_
- `mobile/src/auth/useAuthState.ts` — function useAuthState: () => void
- `mobile/src/hooks/useNoteForm.ts` — function useNoteForm: (type, onSuccess) => void
- `mobile/src/hooks/useNotifications.ts` — function useNotifications: () => void
- `mobile/src/hooks/useOfflineNotes.ts`
  - function useIsOffline: () => void
  - function useOfflineNotes: (binderId?, type?) => void
  - function useOfflineNoteDetail: (noteId) => void
- `mobile/src/lib/supabase.ts` — function getSupabase: () => SupabaseClient, const supabase
- `mobile/src/services/notifications.ts` — function registerForPushNotifications: () => Promise<string | null>, function unregisterPushNotifications: () => Promise<void>
- `mobile/src/services/offline/database.ts`
  - function getDatabase: () => Promise<SQLite.SQLiteDatabase>
  - function clearDatabase: () => Promise<void>
  - function getSyncMeta: (key) => Promise<string | null>
  - function setSyncMeta: (key, value) => Promise<void>
  - function getOfflineNotes: (binderId?, type?) => void
  - function getOfflineNoteById: (id) => void
  - _...7 more_
- `mobile/src/services/offline/sync.service.ts`
  - function downloadNotesForOffline: (onProgress?, hasMore) => void
  - function replayPendingMutations: () => Promise<
  - function clearOfflineData: () => Promise<void>
  - function getOfflineStorageSize: () => Promise<number>
- `mobile/src/services/purchases.ts`
  - function initPurchases: (appUserId?) => void
  - function getOfferings: () => Promise<PurchasesOffering | null>
  - function purchasePackage: (pkg) => Promise<CustomerInfo | null>
  - function restorePurchases: () => Promise<CustomerInfo | null>
  - function checkSubscriptionStatus: () => Promise<void>
- `packages/shared-api/src/client.ts` — function createApiClient: (config) => AxiosInstance, interface ApiClientConfig
- `packages/shared-api/src/endpoints.ts`
  - function createAuthApi: (client) => void
  - function createUsersApi: (client) => void
  - function createBindersApi: (client) => void
  - function createTagsApi: (client) => void
  - function createVenuesApi: (client) => void
  - function createPhotosApi: (client) => void
  - _...5 more_
- `web/src/hooks/use-click-outside.ts` — function useClickOutside: (ref, handler) => void
- `web/src/hooks/use-debounce.ts` — function useDebounce: (value, delay) => T
- `web/src/hooks/use-intersection-observer.ts` — function useIntersectionObserver: (options?) => void
- `web/src/hooks/use-note-form.ts` — function useNoteForm: (type, onSuccess) => void, interface NoteFormData
- `web/src/lib/api/clients/redis.ts`
  - function getJson: (key) => Promise<T | null>
  - function setJson: (key, value, ttlSeconds) => Promise<void>
  - const redis
- `web/src/lib/api/clients/supabase-server.ts` — function getSupabaseAdmin: () => SupabaseClient, const supabaseAdmin
- `web/src/lib/api/middleware.ts`
  - function withAuth: (handler) => void
  - function withPremium: (handler) => void
  - function withCron: (handler) => void
- `web/src/lib/api/response.ts` — function apiSuccess: (data, status) => void, function apiError: (message, status) => void
- `web/src/lib/api/services/geo.ts` — function computeBoundingBox: (lat, lng, radiusKm) => BoundingBox, interface BoundingBox
- `web/src/lib/api/services/users.service.ts` — function sanitizeUser: (user) => SanitizedUser, const usersService
- `web/src/lib/api/validators/notes.ts`
  - function validateExtension: (type, extension) => void
  - const restaurantExtensionSchema
  - const wineExtensionSchema
  - const spiritExtensionSchema
  - const wineryVisitExtensionSchema
  - const createNoteSchema
  - _...2 more_
- `web/src/lib/api.ts`
  - function setOnUnauthorized: (cb) => void
  - const apiClient
  - const authApi
  - const usersApi
  - const bindersApi
  - const tagsApi
  - _...5 more_
- `web/src/lib/supabase/client.ts` — function createSupabaseBrowserClient: () => SupabaseClient
- `web/src/lib/supabase/middleware.ts` — function updateSession: (request) => void
- `web/src/lib/supabase/server.ts` — function createSupabaseServerClient: () => void
- `web/src/lib/supabase-auth.ts`
  - function signInWithGoogle: () => Promise<AuthUser>
  - function signInWithEmail: (email, password) => Promise<AuthUser>
  - function signUpWithEmail: (email, password, displayName) => Promise<AuthUser>
  - function signOut: () => Promise<void>
  - function getIdToken: () => Promise<string | null>
  - function onAuthStateChanged: (callback) => void
  - _...3 more_
- `web/src/lib/utils.ts` — function cn: (...inputs) => void

---

# Config

## Environment Variables

- `ALLOWED_ORIGINS` (has default) — backend/.env
- `CRON_SECRET` **required** — web/src/lib/api/middleware.ts
- `DATABASE_URL` (has default) — backend/.env
- `EXPO_PUBLIC_API_URL` (has default) — mobile/.env.local
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (has default) — mobile/.env.local
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (has default) — mobile/.env.local
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (has default) — mobile/.env.local
- `EXPO_PUBLIC_REVENUECAT_API_KEY` **required** — mobile/src/services/purchases.ts
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (has default) — mobile/.env.local
- `EXPO_PUBLIC_SUPABASE_URL` (has default) — mobile/.env.local
- `FIREBASE_CLIENT_EMAIL` (has default) — backend/.env
- `FIREBASE_PRIVATE_KEY` (has default) — backend/.env
- `FIREBASE_PROJECT_ID` (has default) — backend/.env
- `GOOGLE_PLACES_API_KEY` (has default) — backend/.env
- `MEILISEARCH_API_KEY` (has default) — backend/.env
- `MEILISEARCH_HOST` (has default) — backend/.env
- `NEXT_PUBLIC_API_URL` (has default) — web/.env.local
- `NEXT_PUBLIC_FIREBASE_API_KEY` (has default) — web/.env.local
- `NEXT_PUBLIC_FIREBASE_APP_ID` (has default) — web/.env.local
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (has default) — web/.env.local
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` (has default) — web/.env.local
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (has default) — web/.env.local
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (has default) — web/.env.local
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (has default) — web/.env.local
- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` (has default) — web/.env.local
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (has default) — web/.env.local
- `NEXT_PUBLIC_SUPABASE_URL` (has default) — web/.env.local
- `NODE_ENV` (has default) — backend/.env
- `PORT` (has default) — backend/.env
- `R2_ACCESS_KEY_ID` (has default) — backend/.env
- `R2_ACCOUNT_ID` (has default) — backend/.env
- `R2_BUCKET_NAME` (has default) — backend/.env
- `R2_PUBLIC_URL` (has default) — backend/.env
- `R2_SECRET_ACCESS_KEY` (has default) — backend/.env
- `REDIS_URL` (has default) — web/.env.local
- `REVENUECAT_WEBHOOK_AUTH_KEY` **required** — web/src/app/api/v1/subscriptions/webhook/route.ts
- `SUPABASE_DB_URL` (has default) — web/.env.local
- `SUPABASE_DB_URL_DIRECT` (has default) — web/.env.local
- `SUPABASE_SERVICE_ROLE_KEY` (has default) — web/.env.local

## Config Files

- `mobile/.env.example`
- `web/next.config.ts`

## Key Dependencies

- next: 16.2.2
- react: 19.1.0

---

# Middleware

## auth
- auth.store — `mobile/src/store/auth.store.ts`
- middleware — `web/src/lib/api/middleware.ts`
- auth-context — `web/src/lib/auth-context.tsx`
- middleware — `web/src/lib/supabase/middleware.ts`

---

# Dependency Graph

## Most Imported Files (change these carefully)

- `mobile/src/theme/index.ts` — imported by **63** files
- `mobile/src/types/index.ts` — imported by **32** files
- `mobile/src/api/endpoints.ts` — imported by **28** files
- `mobile/src/navigation/types.ts` — imported by **24** files
- `web/src/lib/api/clients/prisma.ts` — imported by **20** files
- `backend/prisma/generated/client/enums.ts` — imported by **19** files
- `backend/prisma/generated/client/internal/prismaNamespace.ts` — imported by **17** files
- `mobile/src/components/common/EmptyState.tsx` — imported by **13** files
- `mobile/src/store/ui.store.ts` — imported by **11** files
- `mobile/src/components/common/Button.tsx` — imported by **10** files
- `mobile/src/components/common/LoadingSpinner.tsx` — imported by **8** files
- `web/src/lib/api/clients/redis.ts` — imported by **8** files
- `mobile/src/store/subscription.store.ts` — imported by **7** files
- `mobile/src/store/auth.store.ts` — imported by **6** files
- `mobile/src/components/common/Input.tsx` — imported by **6** files
- `mobile/src/components/social/UserCard.tsx` — imported by **6** files
- `mobile/src/components/common/NoteCardSkeleton.tsx` — imported by **4** files
- `mobile/src/components/notes/NoteCard.tsx` — imported by **4** files
- `mobile/src/screens/social/UserProfileScreen.tsx` — imported by **4** files
- `mobile/src/screens/social/PinGourmetFriendScreen.tsx` — imported by **4** files

## Import Map (who imports what)

- `mobile/src/theme/index.ts` ← `mobile/App.tsx`, `mobile/src/components/common/BinderCardSkeleton.tsx`, `mobile/src/components/common/Button.tsx`, `mobile/src/components/common/Chip.tsx`, `mobile/src/components/common/EmptyState.tsx` +58 more
- `mobile/src/types/index.ts` ← `mobile/src/components/forms/BinderSelector.tsx`, `mobile/src/components/forms/TagSelector.tsx`, `mobile/src/components/map/VenuePreviewCard.tsx`, `mobile/src/components/menu-decider/DishCard.tsx`, `mobile/src/components/notes/NoteCard.tsx` +27 more
- `mobile/src/api/endpoints.ts` ← `mobile/src/auth/useAuthState.ts`, `mobile/src/components/forms/VenueSearchInput.tsx`, `mobile/src/components/map/MapSearchBar.tsx`, `mobile/src/components/social/FollowButton.tsx`, `mobile/src/components/social/TasteSignalButtons.tsx` +23 more
- `mobile/src/navigation/types.ts` ← `mobile/src/navigation/AuthNavigator.tsx`, `mobile/src/navigation/BindersStackNavigator.tsx`, `mobile/src/navigation/HomeStackNavigator.tsx`, `mobile/src/navigation/MainNavigator.tsx`, `mobile/src/navigation/NoteCreationNavigator.tsx` +19 more
- `web/src/lib/api/clients/prisma.ts` ← `web/src/lib/api/middleware.ts`, `web/src/lib/api/services/area-explorer.service.ts`, `web/src/lib/api/services/binders.service.ts`, `web/src/lib/api/services/menu-decider.service.ts`, `web/src/lib/api/services/notes.search.service.ts` +15 more
- `backend/prisma/generated/client/enums.ts` ← `backend/prisma/generated/client/browser.ts`, `backend/prisma/generated/client/browser.ts`, `backend/prisma/generated/client/client.ts`, `backend/prisma/generated/client/client.ts`, `backend/prisma/generated/client/client.ts` +14 more
- `backend/prisma/generated/client/internal/prismaNamespace.ts` ← `backend/prisma/generated/client/client.ts`, `backend/prisma/generated/client/commonInputTypes.ts`, `backend/prisma/generated/client/internal/class.ts`, `backend/prisma/generated/client/internal/prismaNamespaceBrowser.ts`, `backend/prisma/generated/client/models/Binder.ts` +12 more
- `mobile/src/components/common/EmptyState.tsx` ← `mobile/src/components/common/index.ts`, `mobile/src/screens/binders/BinderDetailScreen.tsx`, `mobile/src/screens/binders/BindersScreen.tsx`, `mobile/src/screens/binders/FollowedBindersScreen.tsx`, `mobile/src/screens/home/HomeScreen.tsx` +8 more
- `mobile/src/store/ui.store.ts` ← `mobile/src/components/map/MapSearchBar.tsx`, `mobile/src/components/map/VenuePreviewCard.tsx`, `mobile/src/hooks/useNoteForm.ts`, `mobile/src/navigation/MainNavigator.tsx`, `mobile/src/screens/map/AreaExplorerScreen.tsx` +6 more
- `mobile/src/components/common/Button.tsx` ← `mobile/src/components/common/EmptyState.tsx`, `mobile/src/components/common/ErrorBoundary.tsx`, `mobile/src/components/common/index.ts`, `mobile/src/screens/home/NoteDetailScreen.tsx`, `mobile/src/screens/note-creation/RestaurantNoteFormScreen.tsx` +5 more

---

# Test Coverage

> **25%** of routes and models are covered by tests
> 2 test files found

## Covered Models

- User
- Binder
- Note
- Venue

---

_Generated by [codesight](https://github.com/Houseofmvps/codesight) — see your codebase clearly_