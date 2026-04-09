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
