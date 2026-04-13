// ---------------------------------------------------------------------------
// Ad SDK Bridge — PRODUCTION ONLY
// ---------------------------------------------------------------------------
// This file is the single integration point for react-native-google-mobile-ads.
// It is NOT imported anywhere in the current codebase. When you're ready to
// ship with real ads via EAS Build:
//
// 1. npx expo install react-native-google-mobile-ads
// 2. Set real EXPO_PUBLIC_ADMOB_*_APP_ID values in .env
// 3. Import { loadAndShowRewardedAd } from '../lib/ads' in AdGate.tsx
// 4. Replace the countdown timer with the real ad flow
//
// This keeps the native SDK completely out of the Metro bundle until needed.
// ---------------------------------------------------------------------------

import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const AD_UNIT_ID = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxx/yyy'; // Replace with real ID

/**
 * Loads and shows a rewarded ad.
 * Resolves `true` if the user earned the reward, `false` if dismissed.
 * Rejects if the ad fails to load within `timeoutMs`.
 */
export function loadAndShowRewardedAd(timeoutMs = 10000): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const rewarded = RewardedAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Ad load timeout'));
    }, timeoutMs);

    const unsubs: (() => void)[] = [];

    function cleanup() {
      clearTimeout(timer);
      unsubs.forEach((u) => u());
    }

    unsubs.push(
      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewarded.show();
      }),
    );

    unsubs.push(
      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        cleanup();
        resolve(true);
      }),
    );

    unsubs.push(
      rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        cleanup();
        resolve(false);
      }),
    );

    unsubs.push(
      rewarded.addAdEventListener(AdEventType.ERROR, (error: any) => {
        cleanup();
        reject(error);
      }),
    );

    rewarded.load();
  });
}
