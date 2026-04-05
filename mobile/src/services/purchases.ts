import Purchases, {
  PurchasesOffering,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { useSubscriptionStore } from '../store/subscription.store';
import { SubscriptionTier } from '../types';

const RC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';

const ENTITLEMENT_ID = 'connoisseur';

export async function initPurchases(appUserId?: string) {
  if (!RC_API_KEY) return;

  Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  await Purchases.configure({ apiKey: RC_API_KEY, appUserID: appUserId });
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) {
    console.warn('getOfferings error:', e);
    return null;
  }
}

export async function purchasePackage(pkg: any): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    syncCustomerInfo(customerInfo);
    return customerInfo;
  } catch (e) {
    console.warn('purchasePackage error:', e);
    return null;
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    syncCustomerInfo(customerInfo);
    return customerInfo;
  } catch (e) {
    console.warn('restorePurchases error:', e);
    return null;
  }
}

export async function checkSubscriptionStatus(): Promise<void> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    syncCustomerInfo(customerInfo);
  } catch (e) {
    console.warn('checkSubscriptionStatus error:', e);
  }
}

function syncCustomerInfo(info: CustomerInfo) {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  const { setSubscription } = useSubscriptionStore.getState();

  if (entitlement) {
    setSubscription(
      SubscriptionTier.CONNOISSEUR,
      entitlement.expirationDate ?? null,
    );
  } else {
    setSubscription(SubscriptionTier.FREE, null);
  }
}
