import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { localCache } from '../../lib/cache';
import { usePremiumContext } from '../../context/PremiumContext';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { isPremium, restore } = usePremiumContext();
  const { mode, setMode, colors } = useTheme();

  const toggleLanguage = () => {
    const next = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(next);
  };

  const clearCache = async () => {
    await localCache.clearAll();
    Alert.alert('Cache vidé');
  };

  return (
    <LinearGradient colors={colors.bg as any} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{"⚙️"} {t('settings.title')}</Text>

        {/* Theme picker */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPARENCE</Text>
          <Text style={[styles.rowLabel, { color: colors.text }]}>{"Thème"}</Text>
          <View style={styles.themePicker}>
            {(['light', 'dark', 'auto'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.themeOpt, mode === opt && styles.themeOptActive]}
                onPress={() => setMode(opt)}
              >
                <Text style={styles.themeIcon}>
                  {opt === 'light' ? '☀️' : opt === 'dark' ? '🌙' : '📱'}
                </Text>
                <Text style={[styles.themeLabel, mode === opt && styles.themeLabelActive]}>
                  {opt === 'light' ? 'Clair' : opt === 'dark' ? 'Sombre' : 'iOS'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language & Settings */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.row} onPress={toggleLanguage}>
            <Text style={[styles.label, { color: colors.text }]}>{"🌐"} {t('settings.language')}</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>{i18n.language === 'fr' ? 'Français' : 'English'}</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>{"📏"} {t('settings.units')}</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>{t('settings.metric')}</Text>
          </View>

          <TouchableOpacity style={[styles.row, styles.rowLast]} onPress={clearCache}>
            <Text style={[styles.label, { color: colors.text }]}>{"🗑️"} {t('settings.clearCache')}</Text>
          </TouchableOpacity>
        </View>

        {/* Premium */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>{"⭐"} Premium</Text>
            <View style={[styles.statusBadge, isPremium ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, isPremium ? styles.statusActiveText : styles.statusInactiveText]}>
                {isPremium ? 'Actif 👑' : 'Inactif'}
              </Text>
            </View>
          </View>

          {!isPremium && (
            <TouchableOpacity style={styles.premiumBtn}>
              <Text style={styles.premiumBtnText}>{"⭐ Passer Premium"}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.row, styles.rowLast]} onPress={restore}>
            <Text style={[styles.label, { color: colors.text }]}>{t('premium.restore')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    padding: 20,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  section: {
    marginHorizontal: 20,
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  themePicker: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 3,
  },
  themeOpt: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 2,
  },
  themeOptActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  themeIcon: { fontSize: 20 },
  themeLabel: { fontSize: 11, fontWeight: '600', color: '#888' },
  themeLabelActive: { color: '#1a1a2e' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 15, fontWeight: '500' },
  value: { fontSize: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusActive: { backgroundColor: '#d4edda' },
  statusInactive: { backgroundColor: '#f0f0f0' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusActiveText: { color: '#155724' },
  statusInactiveText: { color: '#888' },
  premiumBtn: {
    backgroundColor: '#E07254',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#E07254',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  premiumBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
