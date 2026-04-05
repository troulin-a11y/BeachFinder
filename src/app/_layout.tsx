import '../i18n';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PremiumProvider, usePremiumContext } from '../context/PremiumContext';
import { AdProvider } from '../context/AdContext';
import { localCache } from '../lib/cache';
import { AdGate } from '../components/AdGate';

function AppContent() {
  const { isPremium, loading } = usePremiumContext();
  const [initialAdShown, setInitialAdShown] = useState(false);
  const router = useRouter();

  // Show ad gate on first open for non-premium users
  const showAdGate = !loading && !isPremium && !initialAdShown;

  return (
    <>
      <StatusBar style="light" />
      <AdGate
        visible={showAdGate}
        dateToUnlock={new Date().toISOString().slice(0, 10)}
        onDismiss={() => setInitialAdShown(true)}
        onUnlocked={() => setInitialAdShown(true)}
        onGoPremium={() => {
          setInitialAdShown(true);
          router.push('/settings');
        }}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="beach/[id]"
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    localCache.init().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <PremiumProvider>
      <AdProvider>
        <AppContent />
      </AdProvider>
    </PremiumProvider>
  );
}
