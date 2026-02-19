import Purchases, {
  PurchasesOffering,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { useSubscriptionStore } from '../store/subscription.store';
import { SubscriptionTier } from '../types';

const RC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';

const ENTITLEMENT_ID = 'connoisseur';

export async function initPurchases(appUserId?: string) {
  if (!RC_API_KEY) return;

  Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  if (Platform.OS === 'ios') {
    await Purchases.configure({ apiKey: RC_API_KEY, appUserID: appUserId });
  } else {
    await Purchases.configure({ apiKey: RC_API_KEY, appUserID: appUserId });
  }
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: any): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    syncCustomerInfo(customerInfo);
    return customerInfo;
  } catch {
    return null;
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    syncCustomerInfo(customerInfo);
    return customerInfo;
  } catch {
    return null;
  }
}

export async function checkSubscriptionStatus(): Promise<void> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    syncCustomerInfo(customerInfo);
  } catch {
    // Silently fail — status will be synced from backend
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
