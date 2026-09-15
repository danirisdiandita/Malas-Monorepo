import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";

import { getRevenueCatAppUserId } from "@/lib/api";

export const YUZU_PRO_ENTITLEMENT = "yuzu_pro";

export async function configureRevenueCat() {
  if (Platform.OS === "web") throw new Error("Subscriptions are unavailable on web.");
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
  if (!apiKey) throw new Error("RevenueCat is not configured for this build.");
  const appUserID = await getRevenueCatAppUserId();

  if (!(await Purchases.isConfigured())) {
    Purchases.configure({ apiKey, appUserID });
  } else if ((await Purchases.getAppUserID()) !== appUserID) {
    await Purchases.logIn(appUserID);
  }
}

export async function getSubscriptionPackages(): Promise<PurchasesPackage[]> {
  await configureRevenueCat();
  return (await Purchases.getOfferings()).current?.availablePackages ?? [];
}

export async function purchaseSubscription(subscriptionPackage: PurchasesPackage) {
  await configureRevenueCat();
  return Purchases.purchasePackage(subscriptionPackage);
}

export async function restoreSubscriptions(): Promise<CustomerInfo> {
  await configureRevenueCat();
  return Purchases.restorePurchases();
}

export function hasYuzuPro(customerInfo: CustomerInfo) {
  return Boolean(customerInfo.entitlements.active[YUZU_PRO_ENTITLEMENT]);
}
