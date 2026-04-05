import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Amenities, BeachTags } from '../types';

interface Props {
  amenities: Amenities;
  tags: BeachTags;
  restaurantCount: number;
  compact?: boolean;
}

export function AmenityTags({ amenities, tags, restaurantCount, compact = false }: Props) {
  const { t } = useTranslation();

  const items: Array<{ icon: string; label: string; show: boolean }> = [
    { icon: '\u{1F6BF}', label: t('amenity.showers'), show: amenities.showers },
    { icon: '\u{1F6BB}', label: t('amenity.toilets'), show: amenities.toilets },
    { icon: '\u{1F17F}\u{FE0F}', label: t('amenity.parking'), show: amenities.parking },
    { icon: '\u{267F}', label: t('amenity.accessible'), show: amenities.accessible },
    { icon: '\u{1F3CA}', label: t('amenity.lifeguard'), show: amenities.lifeguard },
    { icon: '\u{1F415}', label: tags.dog === 'leashed' ? t('amenity.dogLeashed') : t('amenity.dog'), show: tags.dog === 'yes' || tags.dog === 'leashed' },
    { icon: '\u{1F37D}', label: `${restaurantCount}`, show: restaurantCount > 0 },
  ];

  const visible = items.filter((i) => i.show);
  if (visible.length === 0) return null;

  return (
    <View style={styles.container}>
      {visible.map((item, i) => (
        <View key={i} style={[styles.tag, compact && styles.tagCompact]}>
          <Text style={styles.tagText}>
            {item.icon}{compact ? '' : ` ${item.label}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagCompact: { paddingHorizontal: 5 },
  tagText: { fontSize: 10, color: '#a5b4c4' },
});
