'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth-context';
import { bindersApi, notesApi } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { NoteType } from '@mygourmetdiary/shared-types';
import { NOTE_TYPE_LABELS } from '@mygourmetdiary/shared-constants';

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: binders } = useQuery({
    queryKey: ['binders'],
    queryFn: () => bindersApi.list(),
  });

  const { data: recentNotes } = useQuery({
    queryKey: ['notes', 'feed', { limit: 100 }],
    queryFn: () => notesApi.feed({ limit: 100 }),
  });

  if (!user) return null;

  const totalNotes = recentNotes?.items?.length ?? 0;
  const totalBinders = binders?.length ?? 0;
  const notesByType = recentNotes?.items?.reduce(
    (acc, note) => {
      acc[note.type] = (acc[note.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  ) ?? {};

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
          <AvatarFallback className="text-2xl">
            {user.displayName?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-heading font-bold">{user.displayName}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            <Calendar className="h-3 w-3 inline mr-1" />
            Joined {format(new Date(user.createdAt), 'MMMM yyyy')}
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <FileText className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-heading font-bold">{totalNotes}</p>
            <p className="text-xs text-muted-foreground">Notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-heading font-bold">{totalBinders}</p>
            <p className="text-xs text-muted-foreground">Binders</p>
          </CardContent>
        </Card>
        {Object.entries(notesByType).length > 0 && (
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-heading font-bold">
                {Object.keys(notesByType).length}
              </p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </CardContent>
          </Card>
        )}
      </div>

      {Object.keys(notesByType).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-heading font-semibold">Notes by Type</h2>
          {Object.entries(notesByType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm">{NOTE_TYPE_LABELS[type as NoteType] || type}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(count / totalNotes) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
