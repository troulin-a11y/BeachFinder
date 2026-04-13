import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Restaurant } from '../types';

const TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
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
    <View>
      <Text style={styles.title}>{'\uD83C\uDF7D\uFE0F'} {t('detail.restaurants')}</Text>
      {restaurants.slice(0, 5).map((r, i) => (
        <View key={i} style={styles.item}>
          <View style={styles.info}>
            <Text style={styles.name}>{r.name}</Text>
            <Text style={styles.meta}>
              {TYPE_LABELS[r.type] ?? r.type} · {Math.round(r.distance)} m
            </Text>
          </View>
          <TouchableOpacity onPress={() => openDirections(r)} style={styles.dirBtn}>
            <Text style={styles.directions}>{t('detail.directions')}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    marginBottom: 6,
  },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  meta: { fontSize: 11, color: '#888', marginTop: 2 },
  dirBtn: {
    backgroundColor: '#e0f7ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  directions: { fontSize: 11, color: '#0077b6', fontWeight: '600' },
});
