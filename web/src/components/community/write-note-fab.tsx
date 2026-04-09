import Link from 'next/link';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WriteNoteFabProps {
  href: string;
}

export function WriteNoteFab({ href }: WriteNoteFabProps) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ size: 'lg' }),
        'fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-40 h-14 w-14 rounded-full shadow-lg',
      )}
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">Write a note</span>
    </Link>
  );
}
