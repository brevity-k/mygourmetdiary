'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OnboardingPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await usersApi.updateMe({ displayName: displayName.trim() });
      await refreshUser();
      router.push('/feed');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-heading text-primary">Welcome, Gourmet!</CardTitle>
          <CardDescription>
            Choose a display name for your journal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-error/10 p-3 text-sm text-error">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your gourmet name"
                maxLength={30}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !displayName.trim()}>
              {loading ? 'Saving...' : 'Start My Diary'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
