'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, PlusCircle, Search, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/binders', label: 'Binders', icon: BookOpen },
  { href: '/notes/new', label: '', icon: PlusCircle, isFab: true },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-light bg-surface lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          if (item.isFab) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center -mt-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg"
              >
                <Icon className="h-7 w-7" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
