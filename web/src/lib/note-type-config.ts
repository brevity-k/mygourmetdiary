import { UtensilsCrossed, Wine, GlassWater, Warehouse } from 'lucide-react';
import { NoteType } from '@mygourmetdiary/shared-types';
import type { LucideIcon } from 'lucide-react';

export interface NoteTypeConfig {
  icon: LucideIcon;
  label: string;
  color: string;
}

export const NOTE_TYPE_CONFIG: Record<NoteType, NoteTypeConfig> = {
  [NoteType.RESTAURANT]: { icon: UtensilsCrossed, label: 'Restaurant', color: 'text-amber-800' },
  [NoteType.WINE]: { icon: Wine, label: 'Wine', color: 'text-red-700' },
  [NoteType.SPIRIT]: { icon: GlassWater, label: 'Spirit', color: 'text-amber-600' },
  [NoteType.WINERY_VISIT]: { icon: Warehouse, label: 'Winery', color: 'text-green-700' },
};
