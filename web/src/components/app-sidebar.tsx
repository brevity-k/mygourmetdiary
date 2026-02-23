'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Search,
  UserCircle,
  PlusCircle,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/binders', label: 'Binders', icon: BookOpen },
  { href: '/notes/new', label: 'New Note', icon: PlusCircle },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-surface">
      <div className="flex h-16 items-center px-6 border-b border-border-light">
        <Link href="/feed" className="flex items-center gap-2">
          <span className="text-xl font-heading font-bold text-primary">MyGourmetDiary</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-light p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mt-2">
            <Avatar className="h-8 w-8">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
              <AvatarFallback className="text-xs">
                {user.displayName?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">{user.displayName}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
