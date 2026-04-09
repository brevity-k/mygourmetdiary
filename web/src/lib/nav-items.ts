import { Home, BookOpen, PlusCircle, Search, Users, Map } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Navigation items shared between sidebar and mobile nav. */
export const NAV_ITEMS: NavItem[] = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/binders', label: 'Binders', icon: BookOpen },
  { href: '/notes/new', label: 'New Note', icon: PlusCircle },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/explore', label: 'Explore', icon: Map },
];
