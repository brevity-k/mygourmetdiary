'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Visibility } from '@mygourmetdiary/shared-types';
import { bindersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { NoteFeed } from '@/components/note-feed';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function BinderDetailPage({ params }: { params: Promise<{ binderId: string }> }) {
  const { binderId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showEdit, setShowEdit] = useState(false);

  const { data: binder, isLoading } = useQuery({
    queryKey: ['binders', binderId],
    queryFn: () => bindersApi.get(binderId),
  });

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVisibility, setEditVisibility] = useState<Visibility>(Visibility.PRIVATE);

  const openEdit = () => {
    if (binder) {
      setEditName(binder.name);
      setEditDesc(binder.description || '');
      setEditVisibility(binder.visibility);
      setShowEdit(true);
    }
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      bindersApi.update(binderId, {
        name: editName,
        description: editDesc || undefined,
        visibility: editVisibility,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binders'] });
      setShowEdit(false);
      showToast('Binder updated!', 'success');
    },
    onError: () => showToast('Failed to update binder', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => bindersApi.remove(binderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binders'] });
      showToast('Binder deleted', 'success');
      router.push('/binders');
    },
    onError: () => showToast('Failed to delete binder', 'error'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  if (!binder) {
    return <div className="text-center py-16 text-muted-foreground">Binder not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/binders')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Binders
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">{binder.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{binder.category}</Badge>
            <Badge variant="secondary">
              {binder.visibility === Visibility.PUBLIC ? (
                <><Eye className="h-3 w-3 mr-1" /> Public</>
              ) : (
                <><EyeOff className="h-3 w-3 mr-1" /> Private</>
              )}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {binder._count?.notes ?? 0} notes
            </span>
          </div>
          {binder.description && (
            <p className="text-muted-foreground mt-2">{binder.description}</p>
          )}
        </div>

        {!binder.isDefault && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-error"
              onClick={() => {
                if (confirm('Delete this binder? Notes will not be deleted.')) {
                  deleteMutation.mutate();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Separator />

      <NoteFeed binderId={binderId} />

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent onClose={() => setShowEdit(false)}>
          <DialogHeader>
            <DialogTitle>Edit Binder</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Public</Label>
              <Switch
                checked={editVisibility === Visibility.PUBLIC}
                onCheckedChange={(c) => setEditVisibility(c ? Visibility.PUBLIC : Visibility.PRIVATE)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
