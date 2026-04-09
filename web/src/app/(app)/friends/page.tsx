'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Users, Compass, BookOpen, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import type {
  GourmetFriend,
  UserSuggestion,
  TasteSimilarity,
  TasteCategory,
  PublicBinder,
  PaginatedResponse,
} from '@mygourmetdiary/shared-types';
import { socialApi } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Category Colors ───────────────────────────────────
const CATEGORY_COLOR: Record<string, string> = {
  RESTAURANT: 'bg-amber-100 text-amber-800',
  WINE: 'bg-rose-100 text-rose-800',
  SPIRIT: 'bg-purple-100 text-purple-800',
  MIXED: 'bg-slate-100 text-slate-800',
};

function categoryBadge(category: string) {
  const cls = CATEGORY_COLOR[category] ?? CATEGORY_COLOR.MIXED;
  return (
    <Badge variant="secondary" className={cls}>
      {category.charAt(0) + category.slice(1).toLowerCase()}
    </Badge>
  );
}

function tssLabel(score: number | null) {
  if (score === null) return 'N/A';
  return `${Math.round(score * 100)}%`;
}

// ─── Friends Tab ───────────────────────────────────────
function FriendsTab() {
  const { data: friends, isLoading } = useQuery<GourmetFriend[]>({
    queryKey: ['social', 'friends'],
    queryFn: () => socialApi.listFriends(),
  });

  if (isLoading) return <CardSkeletonList count={3} />;

  if (!friends || friends.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12 text-muted-foreground" />}
        title="No gourmet friends yet"
        description="Discover taste-matched gourmets!"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {friends.map((friend) => (
        <Link key={friend.id} href={`/profile/${friend.pinnedId}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  {friend.pinned.avatarUrl && (
                    <AvatarImage src={friend.pinned.avatarUrl} alt={friend.pinned.displayName} />
                  )}
                  <AvatarFallback>
                    {friend.pinned.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold truncate">
                    {friend.pinned.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pinned {format(new Date(friend.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {friend.categories.map((cat) => (
                  <span key={cat}>{categoryBadge(cat)}</span>
                ))}
              </div>

              {friend.similarities.length > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {friend.similarities.map((sim) => (
                    <div key={sim.category}>
                      <p className="text-muted-foreground">
                        {sim.category.charAt(0) + sim.category.slice(1).toLowerCase()}
                      </p>
                      <p className="font-semibold">{tssLabel(sim.score)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ─── Discover Tab ──────────────────────────────────────
function DiscoverTab() {
  const { data, isLoading } = useQuery<{ items: UserSuggestion[]; total: number }>({
    queryKey: ['social', 'discover'],
    queryFn: () => socialApi.discoverUsers(undefined, 20),
  });

  if (isLoading) return <CardSkeletonList count={3} />;

  const suggestions = data?.items ?? [];

  if (suggestions.length === 0) {
    return (
      <EmptyState
        icon={<Compass className="h-12 w-12 text-muted-foreground" />}
        title="No discoveries yet"
        description="Write more notes to discover taste-matched gourmets."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {suggestions.map((suggestion) => (
        <Card key={suggestion.user.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar>
                {suggestion.user.avatarUrl && (
                  <AvatarImage src={suggestion.user.avatarUrl} alt={suggestion.user.displayName} />
                )}
                <AvatarFallback>
                  {suggestion.user.displayName?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-semibold truncate">
                  {suggestion.user.displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {suggestion.sharedItemCount} shared item{suggestion.sharedItemCount !== 1 && 's'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {categoryBadge(suggestion.bestCategory)}
              <span className="text-sm font-medium">
                {tssLabel(suggestion.bestScore)} match
              </span>
            </div>

            <Link href={`/profile/${suggestion.user.id}`}>
              <Button variant="outline" size="sm" className="w-full mt-1">
                View Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Following Tab ─────────────────────────────────────
interface FollowedBinder {
  id: string;
  binderId: string;
  binder: PublicBinder & { owner?: { id: string; displayName: string; avatarUrl: string | null } };
  createdAt: string;
}

function FollowingTab() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<FollowedBinder>>({
    queryKey: ['social', 'following'],
    queryFn: () => socialApi.listFollowing(),
  });

  const unfollowMutation = useMutation({
    mutationFn: (binderId: string) => socialApi.unfollowBinder(binderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'following'] });
    },
  });

  if (isLoading) return <CardSkeletonList count={3} />;

  const follows = data?.items ?? [];

  if (follows.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="h-12 w-12 text-muted-foreground" />}
        title="Not following any binders"
        description="You're not following any binders yet."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {follows.map((follow) => (
        <Card key={follow.id}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-heading font-semibold truncate">{follow.binder.name}</p>
                {follow.binder.owner && (
                  <Link
                    href={`/profile/${follow.binder.owner.id}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    by {follow.binder.owner.displayName}
                  </Link>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => unfollowMutation.mutate(follow.binderId)}
                disabled={unfollowMutation.isPending}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {categoryBadge(follow.binder.category)}
              {follow.binder._count && (
                <span className="text-xs text-muted-foreground">
                  {follow.binder._count.notes} note{follow.binder._count.notes !== 1 && 's'}
                </span>
              )}
            </div>

            {follow.binder.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {follow.binder.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Shared Components ─────────────────────────────────
function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="font-heading font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function CardSkeletonList({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────
export default function FriendsPage() {
  const [tab, setTab] = useState('friends');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold text-foreground">Friends</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="friends">Gourmet Friends</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <FriendsTab />
        </TabsContent>
        <TabsContent value="discover">
          <DiscoverTab />
        </TabsContent>
        <TabsContent value="following">
          <FollowingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
