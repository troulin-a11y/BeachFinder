import '../i18n';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PremiumProvider } from '../context/PremiumContext';
import { AdProvider } from '../context/AdContext';
import { ThemeProvider } from '../context/ThemeContext';
import { localCache } from '../lib/cache';

function AppContent() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="beach/[id]" />
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
    <ThemeProvider>
      <PremiumProvider>
        <AdProvider>
          <AppContent />
        </AdProvider>
      </PremiumProvider>
    </ThemeProvider>
  );
}
