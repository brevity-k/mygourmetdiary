import { create } from 'zustand';
import { Visibility } from '../types';

export interface VenueSelection {
  placeId: string;
  name: string;
  address?: string;
  coordinate?: { latitude: number; longitude: number };
}

interface UIState {
  defaultVisibility: Visibility;
  setDefaultVisibility: (visibility: Visibility) => void;
  showNoteCreation: boolean;
  pendingVenue: VenueSelection | null;
  openNoteCreation: (venue?: VenueSelection) => void;
  closeNoteCreation: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  defaultVisibility: Visibility.PRIVATE,
  setDefaultVisibility: (defaultVisibility) => set({ defaultVisibility }),
  showNoteCreation: false,
  pendingVenue: null,
  openNoteCreation: (venue) =>
    set({ showNoteCreation: true, pendingVenue: venue ?? null }),
  closeNoteCreation: () =>
    set({ showNoteCreation: false, pendingVenue: null }),
}));
