import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { localCache } from '../../lib/cache';
import { usePremiumContext } from '../../context/PremiumContext';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { isPremium, restore } = usePremiumContext();

  const toggleLanguage = () => {
    const next = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(next);
  };

  const clearCache = async () => {
    await localCache.clearAll();
    Alert.alert('Cache vid\u00e9');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={toggleLanguage}>
          <Text style={styles.label}>{t('settings.language')}</Text>
          <Text style={styles.value}>{i18n.language === 'fr' ? 'Fran\u00e7ais' : 'English'}</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.units')}</Text>
          <Text style={styles.value}>{t('settings.metric')}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.theme')}</Text>
          <Text style={styles.value}>{t('settings.themeAuto')}</Text>
        </View>

        <TouchableOpacity style={styles.row} onPress={clearCache}>
          <Text style={styles.label}>{t('settings.clearCache')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Premium</Text>
          <Text style={[styles.value, isPremium && styles.premium]}>
            {isPremium ? 'Actif' : 'Inactif'}
          </Text>
        </View>

        {!isPremium && (
          <TouchableOpacity style={styles.premiumBtn}>
            <Text style={styles.premiumBtnText}>{t('settings.manageSub')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.row} onPress={restore}>
          <Text style={styles.label}>{t('premium.restore')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', padding: 16 },
  section: { marginHorizontal: 16, backgroundColor: '#132238', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e3a5f',
  },
  label: { fontSize: 14, color: '#fff' },
  value: { fontSize: 14, color: '#6b8aaa' },
  premium: { color: '#22c55e' },
  premiumBtn: {
    backgroundColor: '#3b82f6', margin: 12, padding: 12,
    borderRadius: 8, alignItems: 'center',
  },
  premiumBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
