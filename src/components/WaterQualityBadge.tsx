import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WaterQualityData } from '../types';

const GRADE_STYLES: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  excellent: { bg: '#d4edda', dot: '#28a745', text: '#155724', label: 'Eau excellente' },
  good: { bg: '#e0f7ff', dot: '#0077b6', text: '#0077b6', label: 'Eau bonne' },
  sufficient: { bg: '#fff3cd', dot: '#ffc107', text: '#856404', label: 'Eau correcte' },
  poor: { bg: '#f8d7da', dot: '#dc3545', text: '#721c24', label: 'Eau insuffisante' },
};

interface Props {
  data: WaterQualityData | null;
  detailed?: boolean;
}

export function WaterQualityBadge({ data, detailed = false }: Props) {
  const { t } = useTranslation();
  if (!data || !data.classification) return null;

  const grade = GRADE_STYLES[data.classification] ?? GRADE_STYLES.good;

  if (!detailed) {
    return (
      <View style={[styles.dotBadge, { backgroundColor: grade.dot }]}>
        <Text style={styles.dotText}>
          {data.classification === 'excellent' ? 'A+' : data.classification === 'good' ? 'A' : data.classification === 'sufficient' ? 'B' : 'C'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, { backgroundColor: grade.bg }]}>
      <View style={[styles.dot, { backgroundColor: grade.dot }]} />
      <View style={styles.info}>
        <Text style={[styles.label, { color: grade.text }]}>{grade.label}</Text>
        {data.source && (
          <Text style={styles.source}>
            {data.source === 'eea' ? 'Agence Européenne' : 'EPA'} · {data.year}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  info: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700' },
  source: { fontSize: 10, color: '#888', marginTop: 2 },
});
