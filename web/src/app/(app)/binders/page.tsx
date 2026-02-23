'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen } from 'lucide-react';
import { BinderCategory, Visibility } from '@mygourmetdiary/shared-types';
import { bindersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

export default function BindersPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: binders, isLoading } = useQuery({
    queryKey: ['binders'],
    queryFn: () => bindersApi.list(),
  });

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('MIXED');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      bindersApi.create({
        name,
        category,
        description: description || undefined,
        visibility: Visibility.PRIVATE,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binders'] });
      setShowCreate(false);
      setName('');
      setDescription('');
      showToast('Binder created!', 'success');
    },
    onError: () => showToast('Failed to create binder', 'error'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">My Binders</h1>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Binder
        </Button>
      </div>

      {(!binders || binders.length === 0) ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No binders yet. Create one to organize your notes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {binders.map((binder) => (
            <Link key={binder.id} href={`/binders/${binder.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-lg font-semibold truncate">{binder.name}</h3>
                    {binder.isDefault && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">Default</Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {binder.category}
                  </Badge>
                  {binder.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{binder.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {binder._count?.notes ?? 0} notes
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)}>
          <DialogHeader>
            <DialogTitle>Create Binder</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="binderName">Name *</Label>
              <Input
                id="binderName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Tokyo Ramen Spots"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="binderCategory">Category</Label>
              <Select
                id="binderCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.values(BinderCategory).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="binderDesc">Description</Label>
              <Textarea
                id="binderDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this binder about?"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
