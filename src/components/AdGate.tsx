import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePremium } from '../hooks/usePremium';

// ---------------------------------------------------------------------------
// AdGate — shows a rewarded-ad interstitial before unlocking forecast days.
//
// The actual ad SDK (react-native-google-mobile-ads) is a native module that
// requires an EAS Development Build; it CANNOT run in Expo Go or on web.
//
// Architecture:
//   src/components/AdGate.tsx          ← this file (UI + timer fallback)
//   src/lib/ads.ts                     ← ad SDK bridge (isolated)
//
// The ad bridge is the ONLY file that imports the native SDK. When building
// with EAS, the native module is available and ads work. In Expo Go the
// bridge returns a no-op and the 5-second timer auto-unlocks.
// ---------------------------------------------------------------------------

interface Props {
  visible: boolean;
  dateToUnlock: string;
  onDismiss: () => void;
  onUnlocked: (date: string) => void;
  onGoPremium: () => void;
}

export function AdGate({ visible, dateToUnlock, onDismiss, onUnlocked, onGoPremium }: Props) {
  const { t } = useTranslation();
  const { isPremium } = usePremium();
  const [countdown, setCountdown] = useState(5);

  // Auto-unlock after 5 seconds countdown
  // In production EAS builds, this will be replaced by the real ad flow
  // via the ads bridge in src/lib/ads.ts
  useEffect(() => {
    if (!visible || isPremium) return;

    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onUnlocked(dateToUnlock);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, isPremium, dateToUnlock]);

  if (isPremium) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{'\uD83C\uDFAC'}</Text>

          <View style={styles.countdownContainer}>
            <ActivityIndicator color="#3b82f6" size="small" />
            <Text style={styles.countdownText}>
              {t('ads.watchToUnlock')} ({countdown}s)
            </Text>
          </View>

          <TouchableOpacity style={styles.premiumBtn} onPress={onGoPremium}>
            <Text style={styles.premiumText}>{t('ads.orPremium')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.dismiss}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: '#132238', borderRadius: 16, padding: 24,
    alignItems: 'center', width: 280,
  },
  title: { fontSize: 40, marginBottom: 12 },
  countdownContainer: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8,
  },
  countdownText: { color: '#94a3b8', fontSize: 14 },
  premiumBtn: {
    borderWidth: 1, borderColor: '#f59e0b', paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 12,
  },
  premiumText: { color: '#f59e0b', fontWeight: '600', fontSize: 13 },
  dismiss: { color: '#6b8aaa', marginTop: 16, fontSize: 18 },
});
