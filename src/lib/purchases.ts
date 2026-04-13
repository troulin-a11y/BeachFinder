// ---------------------------------------------------------------------------
// RevenueCat Bridge — PRODUCTION ONLY
// ---------------------------------------------------------------------------
// This file is the single integration point for react-native-purchases.
// It is NOT imported anywhere in the current codebase. When you're ready to
// ship with real subscriptions via EAS Build:
//
// 1. npx expo install react-native-purchases
// 2. Set real EXPO_PUBLIC_REVENUECAT_*_KEY values in .env
// 3. Import and use these functions in PremiumContext.tsx
// ---------------------------------------------------------------------------

import Purchases from 'react-native-purchases';
import type { CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

export function configurePurchases(): void {
  Purchases.configure({
    apiKey: Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!,
    })!,
  });
}

export async function checkPremiumStatus(): Promise<boolean> {
  const info: CustomerInfo = await Purchases.getCustomerInfo();
  return info.entitlements.active['premium'] !== undefined;
}

export async function restorePurchases(): Promise<boolean> {
  const info: CustomerInfo = await Purchases.restorePurchases();
  return info.entitlements.active['premium'] !== undefined;
}

export function onPremiumStatusChange(callback: (isPremium: boolean) => void): () => void {
  const listener = (info: CustomerInfo) => {
    callback(info.entitlements.active['premium'] !== undefined);
  };
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
