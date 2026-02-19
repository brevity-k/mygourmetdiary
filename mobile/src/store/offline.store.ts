import { create } from 'zustand';

interface OfflineState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  downloadedNotes: number;
  storageSizeBytes: number;
  pendingMutations: number;
  setSyncing: (syncing: boolean) => void;
  setLastSync: (lastSyncAt: string, downloadedNotes: number) => void;
  setStorageSize: (bytes: number) => void;
  setPendingMutations: (count: number) => void;
  reset: () => void;
}

export const useOfflineStore = create<OfflineState>()((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  downloadedNotes: 0,
  storageSizeBytes: 0,
  pendingMutations: 0,
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSync: (lastSyncAt, downloadedNotes) =>
    set({ lastSyncAt, downloadedNotes }),
  setStorageSize: (bytes) => set({ storageSizeBytes: bytes }),
  setPendingMutations: (count) => set({ pendingMutations: count }),
  reset: () =>
    set({
      isSyncing: false,
      lastSyncAt: null,
      downloadedNotes: 0,
      storageSizeBytes: 0,
      pendingMutations: 0,
    }),
}));
