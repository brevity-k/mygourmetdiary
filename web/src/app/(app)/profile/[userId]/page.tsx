'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Calendar, BookOpen, FileText, UserPlus, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import type {
  PublicProfile,
  TasteSimilarity,
  CanPinResult,
  TasteCategory,
} from '@mygourmetdiary/shared-types';
import { socialApi } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

function tssPercent(score: number | null) {
  if (score === null) return 'N/A';
  return `${Math.round(score * 100)}%`;
}

// ─── TSS Display ───────────────────────────────────────
function TasteCompatibility({ similarities }: { similarities: TasteSimilarity[] }) {
  if (similarities.length === 0) return null;

  const hasMeaningfulScore = similarities.some((s) => s.score !== null);
  if (!hasMeaningfulScore) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Taste Compatibility</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {similarities.map((sim) => (
            <div key={sim.category} className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                {sim.category.charAt(0) + sim.category.slice(1).toLowerCase()}
              </p>
              <p className="text-2xl font-heading font-bold">
                {tssPercent(sim.score)}
              </p>
              <p className="text-xs text-muted-foreground">
                {sim.overlapCount} shared item{sim.overlapCount !== 1 && 's'}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Pin Button ────────────────────────────────────────
function PinButton({
  userId,
  isPinned,
  similarities,
}: {
  userId: string;
  isPinned: boolean;
  similarities: TasteSimilarity[];
}) {
  const queryClient = useQueryClient();

  const pinMutation = useMutation({
    mutationFn: () => {
      const eligibleCategories = similarities
        .filter((s) => s.score !== null && s.score >= 0.7 && s.overlapCount >= 5)
        .map((s) => s.category);
      return socialApi.pinFriend(userId, eligibleCategories as string[]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['social', 'friends'] });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: () => socialApi.unpinFriend(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['social', 'friends'] });
    },
  });

  if (isPinned) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => unpinMutation.mutate()}
        disabled={unpinMutation.isPending}
      >
        <UserCheck className="h-4 w-4 mr-1.5" />
        Pinned
      </Button>
    );
  }

  const canPin = similarities.some(
    (s) => s.score !== null && s.score >= 0.7 && s.overlapCount >= 5,
  );

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => pinMutation.mutate()}
      disabled={!canPin || pinMutation.isPending}
      title={canPin ? 'Pin as Gourmet Friend' : 'Need 70%+ match with 5+ shared items'}
    >
      <UserPlus className="h-4 w-4 mr-1.5" />
      Pin as Friend
    </Button>
  );
}

// ─── Main Page ─────────────────────────────────────────
export default function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const { data: profile, isLoading, isError } = useQuery<PublicProfile>({
    queryKey: ['social', 'profile', userId],
    queryFn: () => socialApi.getPublicProfile(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar className="h-20 w-20">
          {profile.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
          )}
          <AvatarFallback className="text-2xl">
            {profile.displayName?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-heading font-bold truncate">
            {profile.displayName}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            <Calendar className="h-3 w-3 inline mr-1" />
            Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {profile.stats.publicNoteCount} note{profile.stats.publicNoteCount !== 1 && 's'}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {profile.stats.publicBinderCount} binder{profile.stats.publicBinderCount !== 1 && 's'}
            </span>
          </div>
        </div>
        <PinButton
          userId={userId}
          isPinned={profile.isPinned}
          similarities={profile.tasteSimilarity}
        />
      </div>

      <Separator />

      {/* Taste Compatibility */}
      <TasteCompatibility similarities={profile.tasteSimilarity} />

      {/* Public Binders */}
      {profile.publicBinders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-heading font-semibold">Public Binders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.publicBinders.map((binder) => (
              <Card key={binder.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-heading font-semibold truncate">{binder.name}</p>
                    {categoryBadge(binder.category)}
                  </div>
                  {binder.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {binder.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {binder._count && (
                      <>
                        <span>{binder._count.notes} note{binder._count.notes !== 1 && 's'}</span>
                        {binder._count.followers !== undefined && (
                          <span>
                            {binder._count.followers} follower{binder._count.followers !== 1 && 's'}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
