import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyBeaches } from '../../hooks/useNearbyBeaches';
import type { Coordinates, EnrichedBeach } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = 280;

const PIN_COLORS: Record<string, string> = {
  green: '#28a745',
  orange: '#ffc107',
  red: '#dc3545',
};

function getTileGrid(lat: number, lng: number, zoom: number = 10) {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom),
  );
  const tiles = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push({
        uri: `https://tile.openstreetmap.org/${zoom}/${x + dx}/${y + dy}.png`,
        x: dx + 1,
        y: dy + 1,
      });
    }
  }
  return tiles;
}

export default function MapScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const { beaches } = useNearbyBeaches(location);

  const handleBeachPress = (beach: EnrichedBeach, index: number) => {
    router.push({ pathname: '/beach/[id]', params: { id: beach.osmId, index: String(index) } });
  };

  const TILE_SIZE = SCREEN_WIDTH / 3;

  return (
    <LinearGradient colors={['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{"🗺️ Carte"}</Text>
      </View>

      {/* Map area */}
      {location && (
        <View style={[styles.mapContainer, { height: MAP_HEIGHT }]}>
          <View style={[styles.tileGrid, { width: TILE_SIZE * 3, height: TILE_SIZE * 3 }]}>
            {getTileGrid(location.latitude, location.longitude).map((tile, i) => (
              <Image
                key={i}
                source={{ uri: tile.uri }}
                style={{
                  position: 'absolute',
                  left: tile.x * TILE_SIZE,
                  top: tile.y * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
              />
            ))}
          </View>
          {/* User location pin */}
          <View style={styles.userPin}>
            <Text style={{ fontSize: 20 }}>{"📍"}</Text>
          </View>
          {/* Attribution */}
          <View style={styles.attribution}>
            <Text style={styles.attributionText}>{"© OpenStreetMap"}</Text>
          </View>
        </View>
      )}

      {/* Beach list below map */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.listTitle}>
          {beaches.length} {beaches.length !== 1 ? 'plages trouvées' : 'plage trouvée'}
        </Text>
        {beaches.map((beach, index) => (
          <TouchableOpacity
            key={beach.osmId}
            style={styles.beachRow}
            onPress={() => handleBeachPress(beach, index)}
          >
            <View style={[styles.indexDot, { backgroundColor: PIN_COLORS[beach.safety?.level ?? 'green'] }]}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <View style={styles.beachInfo}>
              <Text style={styles.beachName} numberOfLines={1}>{beach.name}</Text>
              <Text style={styles.beachMeta}>
                {beach.distance < 1
                  ? `${Math.round(beach.distance * 1000)} m`
                  : `${beach.distance.toFixed(1)} km`}
                {beach.seaTemp ? ` · ${Math.round(beach.seaTemp.temperature)}°C` : ''}
                {beach.weather ? ` · ${Math.round(beach.weather.windSpeed)} km/h` : ''}
              </Text>
            </View>
            <Text style={styles.arrow}>{'›'}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  mapContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#b0d4f1',
    position: 'relative',
  },
  tileGrid: {
    position: 'absolute',
    top: -40,
    left: 0,
  },
  userPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -10,
    marginTop: -20,
  },
  attribution: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attributionText: { fontSize: 9, color: '#555' },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  listTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 10,
  },
  beachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  indexDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  indexText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  beachInfo: { flex: 1 },
  beachName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  beachMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  arrow: { fontSize: 22, color: '#ccc', fontWeight: '300' },
});
