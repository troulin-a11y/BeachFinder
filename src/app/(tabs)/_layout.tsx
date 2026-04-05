import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b8aaa',
        tabBarStyle: {
          backgroundColor: '#0d1d33',
          borderTopColor: '#1e3a5f',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home.title'),
          tabBarIcon: () => <TabIcon emoji={'\uD83C\uDFD6'} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('search.title'),
          tabBarIcon: () => <TabIcon emoji={'\uD83D\uDD0D'} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('favorites.title'),
          tabBarIcon: () => <TabIcon emoji={'\u2B50'} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.title'),
          tabBarIcon: () => <TabIcon emoji={'\u2699\uFE0F'} />,
        }}
      />
    </Tabs>
  );
}
