# UI

> **Navigation aid.** Component inventory and prop signatures extracted via AST. Read the source files before adding props or modifying component logic.

**103 components** (react)

## Client Components

- **BinderDetailPage** — props: params — `web/src/app/(app)/binders/[binderId]/page.tsx`
- **BindersPage** — `web/src/app/(app)/binders/page.tsx`
- **AppError** — props: error, reset — `web/src/app/(app)/error.tsx`
- **ExplorePage** — `web/src/app/(app)/explore/page.tsx`
- **FeedPage** — `web/src/app/(app)/feed/page.tsx`
- **AppLayout** — `web/src/app/(app)/layout.tsx`
- **EditNotePage** — props: params — `web/src/app/(app)/notes/[noteId]/edit/page.tsx`
- **NoteDetailPage** — props: params — `web/src/app/(app)/notes/[noteId]/page.tsx`
- **NewNotePage** — `web/src/app/(app)/notes/new/page.tsx`
- **NewRestaurantNotePage** — `web/src/app/(app)/notes/new/restaurant/page.tsx`
- **NewSpiritNotePage** — `web/src/app/(app)/notes/new/spirit/page.tsx`
- **NewWineNotePage** — `web/src/app/(app)/notes/new/wine/page.tsx`
- **NewWineryVisitNotePage** — `web/src/app/(app)/notes/new/winery-visit/page.tsx`
- **ProfilePage** — `web/src/app/(app)/profile/page.tsx`
- **SearchPage** — `web/src/app/(app)/search/page.tsx`
- **SettingsPage** — `web/src/app/(app)/settings/page.tsx`
- **AuthError** — props: error, reset — `web/src/app/(auth)/error.tsx`
- **LoginPage** — `web/src/app/(auth)/login/page.tsx`
- **OnboardingPage** — `web/src/app/(auth)/onboarding/page.tsx`
- **RegisterPage** — `web/src/app/(auth)/register/page.tsx`
- **HomePage** — `web/src/app/page.tsx`
- **AppSidebar** — `web/src/components/app-sidebar.tsx`
- **AreaExplorerMap** — `web/src/components/map/area-explorer-map.tsx`
- **FeedMapView** — props: typeFilter, binderId — `web/src/components/map/feed-map-view.tsx`
- **GoogleMapsProvider** — `web/src/components/map/google-maps-provider.tsx`
- **StaticVenueMap** — props: lat, lng, venueName, noteType — `web/src/components/map/static-venue-map.tsx`
- **VenueInfoPopover** — props: venue, noteCount, avgRating — `web/src/components/map/venue-info-popover.tsx`
- **VenuePreviewPanel** — props: pin, onClose — `web/src/components/map/venue-preview-panel.tsx`
- **VenuePreviewBottomPanel** — props: pin, onClose — `web/src/components/map/venue-preview-panel.tsx`
- **MobileNav** — `web/src/components/mobile-nav.tsx`
- **NoteCard** — props: note — `web/src/components/note-card.tsx`
- **NoteFeed** — props: typeFilter, binderId — `web/src/components/note-feed.tsx`
- **NoteFormLayout** — props: type, title, formData, venue, photos, setPhotos, updateField, handleVenueChange, onSubmit, isSubmitting — `web/src/components/note-form-layout.tsx`
- **PhotoGallery** — props: photos — `web/src/components/photo-gallery.tsx`
- **PhotoUploader** — props: photos, onChange, maxPhotos — `web/src/components/photo-uploader.tsx`
- **RatingInput** — props: value, onChange — `web/src/components/rating-input.tsx`
- **TagSelector** — props: category, group, value, onChange — `web/src/components/tag-selector.tsx`
- **VenueSearch** — props: value, onChange — `web/src/components/venue-search.tsx`
- **AuthProvider** — `web/src/lib/auth-context.tsx`
- **ProvidersInner** — `web/src/lib/providers-inner.tsx`
- **Providers** — `web/src/lib/providers.tsx`

## Components

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
- **RootLayout** — `web/src/app/layout.tsx`
- **RatingDisplay** — props: rating, size — `web/src/components/rating-display.tsx`

---
_Back to [overview.md](./overview.md)_