import '../i18n';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PremiumProvider } from '../context/PremiumContext';
import { AdProvider } from '../context/AdContext';
import { localCache } from '../lib/cache';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    localCache.init().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <PremiumProvider>
      <AdProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="beach/[id]"
            options={{ presentation: 'card', animation: 'slide_from_right' }}
          />
        </Stack>
      </AdProvider>
    </PremiumProvider>
  );
}
