import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// ---------------------------------------------------------------------------
// PremiumContext — tracks whether the user has an active premium subscription.
//
// The actual RevenueCat SDK (react-native-purchases) is a native module that
// requires an EAS Development Build; it CANNOT run in Expo Go or on web.
//
// When ready for production:
//   1. npx expo install react-native-purchases
//   2. Set real EXPO_PUBLIC_REVENUECAT_*_KEY values in .env
//   3. Uncomment the RevenueCat integration in src/lib/purchases.ts
//   4. Import and call it from this context's useEffect
//
// Until then, isPremium defaults to false and loading resolves immediately.
// ---------------------------------------------------------------------------

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
    // RevenueCat integration is disabled until EAS Build is configured.
    // See src/lib/purchases.ts for the production implementation.
    setLoading(false);
  }, []);

  const restore = useCallback(async () => {
    // No-op until RevenueCat is configured.
    // In production: const info = await Purchases.restorePurchases();
  }, []);

  const value = useMemo(() => ({ isPremium, loading, restore }), [isPremium, loading, restore]);

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremiumContext = () => useContext(PremiumContext);
