import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SafetyData } from '../types';

const COLORS = {
  green: { bg: '#d4edda', text: '#155724', flag: '#28a745' },
  orange: { bg: '#fff3cd', text: '#856404', flag: '#ffc107' },
  red: { bg: '#f8d7da', text: '#721c24', flag: '#dc3545' },
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
    <View style={[styles.banner, { backgroundColor: colors.bg }]}>
      <View style={[styles.flag, { backgroundColor: colors.flag }]} />
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          {t(safety.label)}
        </Text>
        <Text style={[styles.reason, { color: colors.text }]}>
          {t(safety.reason)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  flag: { width: 28, height: 18, borderRadius: 3 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  textContainer: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700' },
  reason: { fontSize: 11, marginTop: 2, opacity: 0.8 },
});
