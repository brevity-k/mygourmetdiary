'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/toast';

export default function SettingsPage() {
  const { user, signOut, refreshUser } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  const updateMutation = useMutation({
    mutationFn: () => usersApi.updateMe({ displayName }),
    onSuccess: () => {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['user'] });
      showToast('Profile updated!', 'success');
    },
    onError: () => showToast('Failed to update profile', 'error'),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-heading font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCircle className="h-5 w-5" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
            />
          </div>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || !displayName.trim() || displayName === user?.displayName}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardContent className="pt-6">
          <Button variant="destructive" onClick={signOut} className="w-full">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
