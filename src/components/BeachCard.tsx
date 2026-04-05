import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { EnrichedBeach } from '../types';
import { PhotoWithFallback } from './PhotoWithFallback';
import { MetricsRow } from './MetricsRow';
import { SafetyBanner } from './SafetyBanner';
import { AmenityTags } from './AmenityTags';
import { formatDistance } from '../utils/distance';

interface Props {
  beach: EnrichedBeach;
  onPress: () => void;
}

export function BeachCard({ beach, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.photoContainer}>
          <PhotoWithFallback
            photo={beach.photo}
            style={styles.photo}
            imageStyle={styles.photoImage}
          />
          {/* Badge overlays */}
          <View style={styles.badges}>
            {beach.tags.blueFlag && (
              <View style={styles.badgeBlue}><Text style={styles.badgeText}>{'\uD83C\uDFC5'}</Text></View>
            )}
            {(beach.tags.dog === 'yes' || beach.tags.dog === 'leashed') && (
              <View style={styles.badgeDog}><Text style={styles.badgeText}>{'\uD83D\uDC15'}</Text></View>
            )}
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.header}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1}>{beach.name}</Text>
              <Text style={styles.location}>
                {formatDistance(beach.distance)} \u00b7 {beach.city ?? ''}
              </Text>
            </View>
            <SafetyBanner safety={beach.safety} compact />
          </View>

          <MetricsRow weather={beach.weather} seaTemp={beach.seaTemp} compact />

          <AmenityTags
            amenities={beach.amenities}
            tags={beach.tags}
            restaurantCount={beach.restaurants.length}
            compact
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#132238',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  row: { flexDirection: 'row' },
  photoContainer: { width: 90, height: 80, position: 'relative' },
  photo: { width: 90, height: 80 },
  photoImage: { width: 90, height: 80 },
  badges: { position: 'absolute', bottom: 2, left: 2, flexDirection: 'row', gap: 2 },
  badgeBlue: { backgroundColor: '#3b82f6', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 3 },
  badgeDog: { backgroundColor: '#8b5cf6', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 3 },
  badgeText: { fontSize: 8 },
  info: { flex: 1, padding: 8, gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nameContainer: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: '#fff' },
  location: { fontSize: 10, color: '#6b8aaa', marginTop: 1 },
});
