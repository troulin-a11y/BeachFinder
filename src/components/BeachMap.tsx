import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import type { Coordinates, EnrichedBeach } from '../types';

const PIN_COLORS = {
  green: '#28a745',
  orange: '#ffc107',
  red: '#dc3545',
};

interface Props {
  userLocation: Coordinates;
  beaches: EnrichedBeach[];
  onBeachPress: (index: number) => void;
}

function getStaticMapUrl(lat: number, lng: number, zoom: number = 11): string {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom),
  );
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

export function BeachMap({ userLocation, beaches, onBeachPress }: Props) {
  const mapUrl = getStaticMapUrl(userLocation.latitude, userLocation.longitude);

  return (
    <View style={styles.container}>
      <Image source={{ uri: mapUrl }} style={styles.mapTile} resizeMode="cover" />
      <View style={styles.overlay}>
        <View style={styles.beachDots}>
          {beaches.slice(0, 10).map((beach, index) => (
            <TouchableOpacity
              key={beach.osmId}
              onPress={() => onBeachPress(index)}
              style={[
                styles.dot,
                { backgroundColor: PIN_COLORS[beach.safety?.level ?? 'green'] },
              ]}
            >
              <Text style={styles.dotText}>{index + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  mapTile: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  beachDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dotText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
