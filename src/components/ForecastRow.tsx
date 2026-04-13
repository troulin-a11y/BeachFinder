import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePremium } from '../hooks/usePremium';
import type { ForecastDay } from '../types';

const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
  '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧', '09n': '🌧', '10d': '🌦', '10n': '🌧',
  '11d': '⛈', '11n': '⛈', '13d': '❄️', '13n': '❄️',
  '50d': '🌫', '50n': '🌫',
};

interface Props {
  forecast: ForecastDay[];
  onUnlockDay: (date: string) => void;
}

export function ForecastRow({ forecast, onUnlockDay }: Props) {
  const { t } = useTranslation();
  const { isPremium, isDayUnlocked } = usePremium();

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3);
  };

  return (
    <View>
      <Text style={styles.title}>{"📅"} {t('detail.forecast')}</Text>
      <View style={styles.row}>
        {forecast.slice(0, 7).map((day) => {
          const unlocked = isDayUnlocked(day.date);

          return (
            <TouchableOpacity
              key={day.date}
              style={[styles.day, !unlocked && styles.locked]}
              disabled={unlocked}
              onPress={() => onUnlockDay(day.date)}
            >
              <Text style={styles.dayLabel}>{getDayLabel(day.date)}</Text>
              <Text style={styles.icon}>
                {unlocked ? (WEATHER_ICONS[day.weatherIcon] ?? '☀️') : '🔒'}
              </Text>
              <Text style={[styles.seaTemp, !unlocked && styles.dimmed]}>
                {unlocked ? `${day.seaTemp ?? '--'}°` : '--'}
              </Text>
              <Text style={[styles.airTemp, !unlocked && styles.dimmed]}>
                {unlocked ? `${Math.round(day.airTemp)}°` : '--'}
              </Text>
              <Text style={[styles.wind, !unlocked && styles.dimmed]}>
                {unlocked ? `${Math.round(day.windSpeed)}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!isPremium && (
        <TouchableOpacity style={styles.unlockBtn} onPress={() => onUnlockDay('')}>
          <Text style={styles.unlockText}>
            {t('ads.watchToUnlock')} · {t('ads.orPremium')}
          </Text>
        </TouchableOpacity>
      )}
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
  row: { flexDirection: 'row', gap: 4 },
  day: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
  },
  locked: { opacity: 0.35 },
  dayLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  icon: { fontSize: 16, marginVertical: 2 },
  seaTemp: { fontSize: 12, fontWeight: '700', color: '#0077b6' },
  airTemp: { fontSize: 9, color: '#f59e0b', fontWeight: '600' },
  wind: { fontSize: 8, color: '#888' },
  dimmed: { color: '#ccc' },
  unlockBtn: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: '#0077b6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  unlockText: { fontSize: 11, color: '#fff', fontWeight: '600' },
});
