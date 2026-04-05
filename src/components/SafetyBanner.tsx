import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SafetyData } from '../types';

const COLORS = {
  green: { bg: '#22c55e22', border: '#22c55e44', text: '#22c55e', flag: '#22c55e' },
  orange: { bg: '#f59e0b22', border: '#f59e0b44', text: '#f59e0b', flag: '#f59e0b' },
  red: { bg: '#ef444422', border: '#ef444444', text: '#ef4444', flag: '#ef4444' },
};

interface Props {
  safety: SafetyData | null;
  compact?: boolean;
}

export function SafetyBanner({ safety, compact = false }: Props) {
  const { t } = useTranslation();
  if (!safety) return null;

  const colors = COLORS[safety.level];

  if (compact) {
    return (
      <View style={[styles.dot, { backgroundColor: colors.flag }]} />
    );
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={[styles.flag, { backgroundColor: colors.flag }]} />
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          {t(safety.label)}
        </Text>
        <Text style={styles.reason}>
          {t(safety.reason)} · {safety.source === 'computed' ? t('safety.sourceComputed') : t('safety.sourceNoaa')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  flag: { width: 28, height: 18, borderRadius: 3 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  textContainer: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700' },
  reason: { fontSize: 9, color: '#6b8aaa', marginTop: 2 },
});
