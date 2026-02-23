'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (firebaseUser) {
      router.replace('/feed');
    } else {
      router.replace('/login');
    }
  }, [firebaseUser, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="animate-pulse text-primary font-heading text-2xl">MyGourmetDiary</div>
    </div>
  );
}
