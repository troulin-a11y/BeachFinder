import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePremium } from '../hooks/usePremium';
import type { ForecastDay } from '../types';

const WEATHER_ICONS: Record<string, string> = {
  '01d': '\u2600\uFE0F', '01n': '\uD83C\uDF19', '02d': '\u26C5', '02n': '\u2601\uFE0F',
  '03d': '\u2601\uFE0F', '03n': '\u2601\uFE0F', '04d': '\u2601\uFE0F', '04n': '\u2601\uFE0F',
  '09d': '\uD83C\uDF27', '09n': '\uD83C\uDF27', '10d': '\uD83C\uDF26', '10n': '\uD83C\uDF27',
  '11d': '\u26C8', '11n': '\u26C8', '13d': '\u2744\uFE0F', '13n': '\u2744\uFE0F',
  '50d': '\uD83C\uDF2B', '50n': '\uD83C\uDF2B',
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
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('detail.forecast')}</Text>
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
                {unlocked ? (WEATHER_ICONS[day.weatherIcon] ?? '\u2600\uFE0F') : '\uD83D\uDD12'}
              </Text>
              <Text style={[styles.seaTemp, !unlocked && styles.dimmed]}>
                {unlocked ? `${day.seaTemp ?? '\u2014'}\u00b0` : '\u2014'}
              </Text>
              <Text style={[styles.airTemp, !unlocked && styles.dimmed]}>
                {unlocked ? `${day.airTemp}\u00b0` : '\u2014'}
              </Text>
              <Text style={[styles.wind, !unlocked && styles.dimmed]}>
                {unlocked ? `${day.windSpeed}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!isPremium && (
        <TouchableOpacity style={styles.unlockBtn} onPress={() => onUnlockDay('')}>
          <Text style={styles.unlockText}>
            {t('ads.watchToUnlock')} \u00b7 {t('ads.orPremium')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#132238', borderRadius: 8, padding: 10 },
  title: { fontSize: 10, color: '#6b8aaa', textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 4 },
  day: {
    flex: 1,
    backgroundColor: '#1a2d47',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  locked: { opacity: 0.3 },
  dayLabel: { fontSize: 10, color: '#6b8aaa' },
  icon: { fontSize: 16, marginVertical: 2 },
  seaTemp: { fontSize: 12, fontWeight: '700', color: '#06b6d4' },
  airTemp: { fontSize: 9, color: '#f59e0b' },
  wind: { fontSize: 8, color: '#a5b4c4' },
  dimmed: { color: '#444' },
  unlockBtn: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  unlockText: { fontSize: 11, color: '#fff' },
});
