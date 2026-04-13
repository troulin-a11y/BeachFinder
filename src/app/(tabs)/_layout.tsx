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
        tabBarActiveTintColor: '#0077b6',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderTopColor: 'rgba(0,0,0,0.05)',
          height: 85,
          paddingTop: 10,
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
          title: 'Carte',
          tabBarIcon: () => <TabIcon emoji={'\uD83D\uDDFA\uFE0F'} />,
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
