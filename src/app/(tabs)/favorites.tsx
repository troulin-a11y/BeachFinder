import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { usePremiumContext } from '../../context/PremiumContext';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { isPremium } = usePremiumContext();

  return (
    <LinearGradient colors={['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8']} style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.icon}>{'⭐'}</Text>
        <Text style={styles.title}>Favoris</Text>
        {isPremium ? (
          <Text style={styles.subtitle}>Appuyez sur le {'❤️'} d'une plage{'\n'}pour l'ajouter aux favoris</Text>
        ) : (
          <>
            <Text style={styles.subtitle}>
              {"Sauvegardez vos plages préférées\navec l'abonnement Premium"}
            </Text>
            <View style={styles.features}>
              <Text style={styles.feat}>{"📅 Prévisions 6 jours"}</Text>
              <Text style={styles.feat}>{"☀️ Indice UV détaillé"}</Text>
              <Text style={styles.feat}>{"💨 Qualité de l'air"}</Text>
              <Text style={styles.feat}>{"🚫 Zéro publicité"}</Text>
              <Text style={styles.feat}>{"⭐ Favoris illimités"}</Text>
            </View>
            <TouchableOpacity style={styles.premiumBtn}>
              <Text style={styles.premiumText}>{"Essai gratuit 7 jours →"}</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.restoreText}>Restaurer un achat</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  icon: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  features: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  feat: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  premiumBtn: {
    backgroundColor: '#E07254',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 50,
    shadowColor: '#E07254',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 6,
    marginBottom: 12,
  },
  premiumText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  restoreText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
});
