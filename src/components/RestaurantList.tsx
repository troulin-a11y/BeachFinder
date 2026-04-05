import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Restaurant } from '../types';

const TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Caf\u00e9',
  fast_food: 'Fast-food',
  ice_cream: 'Glacier',
};

interface Props {
  restaurants: Restaurant[];
}

export function RestaurantList({ restaurants }: Props) {
  const { t } = useTranslation();
  if (restaurants.length === 0) return null;

  const openDirections = (r: Restaurant) => {
    const { latitude, longitude } = r.location;
    const url = Platform.select({
      ios: `maps:?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('detail.restaurants')}</Text>
      {restaurants.slice(0, 5).map((r, i) => (
        <View key={i} style={styles.item}>
          <View style={styles.info}>
            <Text style={styles.name}>{r.name}</Text>
            <Text style={styles.meta}>
              {TYPE_LABELS[r.type] ?? r.type} \u00b7 {r.distance}m
            </Text>
          </View>
          <TouchableOpacity onPress={() => openDirections(r)}>
            <Text style={styles.directions}>{t('detail.directions')}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#132238', borderRadius: 8, padding: 10 },
  title: { fontSize: 10, color: '#6b8aaa', textTransform: 'uppercase', marginBottom: 8 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
    backgroundColor: '#1a2d47',
    borderRadius: 6,
    marginBottom: 4,
  },
  info: { flex: 1 },
  name: { fontSize: 12, fontWeight: '700', color: '#fff' },
  meta: { fontSize: 9, color: '#6b8aaa' },
  directions: { fontSize: 10, color: '#3b82f6' },
});
