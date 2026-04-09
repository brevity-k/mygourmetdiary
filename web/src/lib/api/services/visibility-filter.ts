export function buildVisibilityFilter(viewerId: string) {
  return {
    OR: [
      { visibility: 'PUBLIC' as const },
      { authorId: viewerId },
      {
        visibility: 'FRIENDS' as const,
        author: { pinnedFriends: { some: { pinnedId: viewerId } } },
      },
    ],
  };
}
