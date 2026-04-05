import React, { createContext, useContext, useState, useEffect } from 'react';
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
    async function init() {
      try {
        Purchases.configure({
          apiKey: Platform.select({
            ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!,
            android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!,
          })!,
        });

        const info: CustomerInfo = await Purchases.getCustomerInfo();
        setIsPremium(info.entitlements.active['premium'] !== undefined);
      } catch {
        setIsPremium(false);
      } finally {
        setLoading(false);
      }
    }

    init();

    // Listen for changes
    const listener = (info: CustomerInfo) => {
      setIsPremium(info.entitlements.active['premium'] !== undefined);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => { Purchases.removeCustomerInfoUpdateListener(listener); };
  }, []);

  const restore = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setIsPremium(info.entitlements.active['premium'] !== undefined);
    } catch {
      // silently fail
    }
  };

  return (
    <PremiumContext.Provider value={{ isPremium, loading, restore }}>
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremiumContext = () => useContext(PremiumContext);
