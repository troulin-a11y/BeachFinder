import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { WeatherData, SeaTempData } from '../types';

interface Props {
  weather: WeatherData | null;
  seaTemp: SeaTempData | null;
  compact?: boolean;
}

export function MetricsRow({ weather, seaTemp, compact = false }: Props) {
  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Text style={styles.compactValue}>
          {seaTemp ? `${Math.round(seaTemp.temperature)}°` : '--'}
        </Text>
        <Text style={styles.compactSep}> · </Text>
        <Text style={styles.compactValue}>
          {weather ? `${Math.round(weather.windSpeed)} km/h` : '--'}
        </Text>
        <Text style={styles.compactSep}> · </Text>
        <Text style={styles.compactValue}>
          {weather ? `${Math.round(weather.airTemp)}°` : '--'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sea temp */}
      <View style={styles.condition}>
        <Text style={styles.icon}>{'\uD83C\uDF0A'}</Text>
        <Text style={styles.value}>
          {seaTemp ? `${Math.round(seaTemp.temperature)}°C` : '--'}
        </Text>
        <Text style={styles.label}>Mer</Text>
      </View>

      {/* Wind */}
      <View style={styles.condition}>
        <Text style={styles.icon}>{'\uD83D\uDCA8'}</Text>
        <Text style={styles.value}>
          {weather ? `${Math.round(weather.windSpeed)} km/h` : '--'}
        </Text>
        <Text style={styles.label}>
          {`Vent${weather?.windDirection ? ` ${weather.windDirection}` : ''}`}
        </Text>
      </View>

      {/* Air temp */}
      <View style={styles.condition}>
        <Text style={styles.icon}>{'\u2600\uFE0F'}</Text>
        <Text style={styles.value}>
          {weather ? `${Math.round(weather.airTemp)}°C` : '--'}
        </Text>
        <Text style={styles.label}>Air</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  condition: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  icon: { fontSize: 22, marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  label: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  compactRow: { flexDirection: 'row', alignItems: 'center' },
  compactValue: { fontSize: 12, fontWeight: '600', color: '#555' },
  compactSep: { fontSize: 12, color: '#ccc' },
});
