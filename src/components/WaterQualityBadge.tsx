import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WaterQualityData } from '../types';

const GRADE_COLORS = {
  excellent: { bg: '#22c55e', text: '#fff', grade: 'A+' },
  good: { bg: '#3b82f6', text: '#fff', grade: 'A' },
  sufficient: { bg: '#f59e0b', text: '#000', grade: 'B' },
  poor: { bg: '#ef4444', text: '#fff', grade: 'C' },
};

interface Props {
  data: WaterQualityData | null;
  detailed?: boolean;
}

export function WaterQualityBadge({ data, detailed = false }: Props) {
  const { t } = useTranslation();
  if (!data || !data.classification) return null;

  const colors = GRADE_COLORS[data.classification];

  if (!detailed) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.badgeText, { color: colors.text }]}>{colors.grade}</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailContainer}>
      <View style={[styles.gradeBig, { backgroundColor: colors.bg }]}>
        <Text style={[styles.gradeText, { color: colors.text }]}>{colors.grade}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.classification, { color: colors.bg }]}>
          {t(`quality.${data.classification}`)}
        </Text>
        <Text style={styles.source}>
          Source: {data.source === 'eea' ? 'Agence Europ\u00e9enne Environnement' : 'EPA'} \u00b7 {data.year}
        </Text>
        {data.ecoli !== null && (
          <Text style={styles.detail}>
            E. coli: {data.ecoli} UFC/100ml \u00b7 Ent\u00e9rocoques: {data.enterococci ?? '\u2014'} UFC/100ml
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  detailContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradeBig: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 14, fontWeight: '700' },
  info: { flex: 1 },
  classification: { fontSize: 12, fontWeight: '700' },
  source: { fontSize: 9, color: '#6b8aaa', marginTop: 2 },
  detail: { fontSize: 10, color: '#a5b4c4', marginTop: 2 },
});
