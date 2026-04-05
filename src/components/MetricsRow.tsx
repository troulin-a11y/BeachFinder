import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WeatherData, SeaTempData } from '../types';

interface Props {
  weather: WeatherData | null;
  seaTemp: SeaTempData | null;
  compact?: boolean;
}

export function MetricsRow({ weather, seaTemp, compact = false }: Props) {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={[styles.metric, !compact && styles.metricBox]}>
        {!compact && <Text style={styles.label}>{t('detail.sea')}</Text>}
        <Text style={[styles.value, styles.seaTemp]}>
          {seaTemp ? `${Math.round(seaTemp.temperature)}°C` : t('errors.noData')}
        </Text>
      </View>
      <View style={[styles.metric, !compact && styles.metricBox]}>
        {!compact && <Text style={styles.label}>{t('detail.air')}</Text>}
        <Text style={[styles.value, styles.airTemp]}>
          {weather ? `${weather.airTemp}°C` : t('errors.noData')}
        </Text>
      </View>
      <View style={[styles.metric, !compact && styles.metricBox]}>
        {!compact && <Text style={styles.label}>{t('detail.wind')}</Text>}
        <Text style={[styles.value, styles.wind]}>
          {weather ? `${weather.windSpeed} km/h` : t('errors.noData')}
        </Text>
        {!compact && weather && (
          <Text style={styles.subLabel}>{weather.windDirection}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8 },
  compact: { gap: 12 },
  metric: { flex: 1, alignItems: 'center' },
  metricBox: {
    backgroundColor: '#132238',
    borderRadius: 8,
    padding: 10,
  },
  label: { fontSize: 10, color: '#6b8aaa', textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '700' },
  seaTemp: { color: '#06b6d4' },
  airTemp: { color: '#f59e0b' },
  wind: { color: '#a5b4c4' },
  subLabel: { fontSize: 9, color: '#6b8aaa', marginTop: 2 },
});
