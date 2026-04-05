import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { useTranslation } from 'react-i18next';
import { usePremium } from '../hooks/usePremium';

const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxx/yyy'; // Replace with real ID

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
  const [adLoaded, setAdLoaded] = useState(false);
  const [adInstance, setAdInstance] = useState<RewardedAd | null>(null);

  useEffect(() => {
    if (isPremium || !visible) return;

    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setAdLoaded(true),
    );
    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => onUnlocked(dateToUnlock),
    );
    const unsubClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => onDismiss(),
    );

    rewarded.load();
    setAdInstance(rewarded);

    return () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
    };
  }, [visible, isPremium]);

  // If ad fails to load after 5s, grant access anyway
  useEffect(() => {
    if (!visible || isPremium) return;
    const timeout = setTimeout(() => {
      if (!adLoaded) {
        onUnlocked(dateToUnlock);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [visible, adLoaded]);

  if (isPremium) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{'\uD83C\uDFAC'}</Text>

          {adLoaded ? (
            <TouchableOpacity
              style={styles.watchBtn}
              onPress={() => adInstance?.show()}
            >
              <Text style={styles.watchText}>{t('ads.watchToUnlock')}</Text>
            </TouchableOpacity>
          ) : (
            <ActivityIndicator color="#3b82f6" style={{ marginVertical: 16 }} />
          )}

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
  watchBtn: {
    backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, marginBottom: 12,
  },
  watchText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  premiumBtn: {
    borderWidth: 1, borderColor: '#f59e0b', paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 12,
  },
  premiumText: { color: '#f59e0b', fontWeight: '600', fontSize: 13 },
  dismiss: { color: '#6b8aaa', marginTop: 16, fontSize: 18 },
});
