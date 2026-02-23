'use client';

import Link from 'next/link';
import { UtensilsCrossed, Wine, GlassWater, Warehouse } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const noteTypes = [
  {
    href: '/notes/new/restaurant',
    label: 'Restaurant',
    description: 'Log a dish from a restaurant visit',
    icon: UtensilsCrossed,
    color: 'text-amber-800 bg-amber-50',
  },
  {
    href: '/notes/new/wine',
    label: 'Wine',
    description: 'Note a wine you tasted',
    icon: Wine,
    color: 'text-red-700 bg-red-50',
  },
  {
    href: '/notes/new/spirit',
    label: 'Spirit',
    description: 'Record a spirit or cocktail',
    icon: GlassWater,
    color: 'text-amber-600 bg-amber-50',
  },
  {
    href: '/notes/new/winery-visit',
    label: 'Winery Visit',
    description: 'Document a winery or distillery visit',
    icon: Warehouse,
    color: 'text-green-700 bg-green-50',
  },
];

export default function NewNotePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-heading font-bold">New Note</h1>
      <p className="text-muted-foreground">What would you like to log?</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {noteTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Link key={type.href} href={type.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="flex items-center gap-4 py-6">
                  <div className={`rounded-lg p-3 ${type.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
