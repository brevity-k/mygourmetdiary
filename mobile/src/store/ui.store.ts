import { create } from 'zustand';
import { Visibility } from '../types';

interface UIState {
  defaultVisibility: Visibility;
  setDefaultVisibility: (visibility: Visibility) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  defaultVisibility: Visibility.PRIVATE,
  setDefaultVisibility: (defaultVisibility) => set({ defaultVisibility }),
}));
