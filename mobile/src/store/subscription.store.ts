import { create } from 'zustand';
import { SubscriptionTier } from '../types';

interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: string | null;
  isActive: boolean;
  setSubscription: (tier: SubscriptionTier, expiresAt: string | null) => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()((set) => ({
  tier: SubscriptionTier.FREE,
  expiresAt: null,
  isActive: false,
  setSubscription: (tier, expiresAt) =>
    set({
      tier,
      expiresAt,
      isActive: tier === SubscriptionTier.CONNOISSEUR,
    }),
  reset: () =>
    set({
      tier: SubscriptionTier.FREE,
      expiresAt: null,
      isActive: false,
    }),
}));
