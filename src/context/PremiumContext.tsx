import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import Purchases from 'react-native-purchases';
import type { CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

interface PremiumState {
  isPremium: boolean;
  loading: boolean;
  restore: () => Promise<void>;
}

const PremiumContext = createContext<PremiumState>({
  isPremium: false,
  loading: true,
  restore: async () => {},
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        Purchases.configure({
          apiKey: Platform.select({
            ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!,
            android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!,
          })!,
        });

        const info: CustomerInfo = await Purchases.getCustomerInfo();
        if (!cancelled) {
          setIsPremium(info.entitlements.active['premium'] !== undefined);
        }
      } catch {
        if (!cancelled) setIsPremium(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Listen for changes — register listener before init() so we don't miss
    // updates that occur during initialization
    const listener = (info: CustomerInfo) => {
      if (!cancelled) {
        setIsPremium(info.entitlements.active['premium'] !== undefined);
      }
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    init();

    return () => {
      cancelled = true;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  const restore = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      setIsPremium(info.entitlements.active['premium'] !== undefined);
    } catch {
      // silently fail
    }
  }, []);

  const value = useMemo(() => ({ isPremium, loading, restore }), [isPremium, loading, restore]);

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremiumContext = () => useContext(PremiumContext);
