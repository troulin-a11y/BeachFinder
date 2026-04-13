import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useNearbyBeaches } from '../../hooks/useNearbyBeaches';
import { useBeachDetail } from '../../hooks/useBeachDetail';
import { useLocation } from '../../hooks/useLocation';
import { AmenityTags } from '../../components/AmenityTags';
import { RestaurantList } from '../../components/RestaurantList';
import { WaterQualityBadge } from '../../components/WaterQualityBadge';
import { ForecastRow } from '../../components/ForecastRow';
import { formatDistance } from '../../utils/distance';

function getUvInfo(uv: number | null | undefined): { text: string; color: string } {
  if (uv == null) return { text: '—', color: '#888' };
  if (uv <= 2) return { text: 'Faible', color: '#27ae60' };
  if (uv <= 5) return { text: 'Modéré', color: '#f39c12' };
  if (uv <= 7) return { text: 'Élevé', color: '#e67e22' };
  if (uv <= 10) return { text: 'Très élevé', color: '#e74c3c' };
  return { text: 'Extrême', color: '#8e44ad' };
}

function getFlagInfo(level?: string): { color: string; text: string } {
  if (level === 'red') return { color: '#dc3545', text: 'Rouge' };
  if (level === 'orange') return { color: '#ffc107', text: 'Jaune' };
  return { color: '#28a745', text: 'Vert' };
}

export default function BeachDetailScreen() {
  const { id, index } = useLocalSearchParams<{ id: string; index: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { location } = useLocation();
  const { beaches, loading } = useNearbyBeaches(location);
  const beach = beaches[parseInt(index ?? '0', 10)] ?? null;
  const { forecast, waterQuality } = useBeachDetail(beach);

  if (!beach) {
    return (
      <LinearGradient colors={['#0077b6', '#00b4d8', '#90e0ef']} style={styles.center}>
        <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 60, left: 20 }}>
          <Text style={{ color: '#fff', fontSize: 28 }}>{'‹'}</Text>
        </TouchableOpacity>
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={[styles.emptyText, { marginTop: 12 }]}>Chargement...</Text>
          </>
        ) : (
          <Text style={styles.emptyText}>{t('errors.noData')}</Text>
        )}
      </LinearGradient>
    );
  }

  const seaTemp = beach.seaTemp ? Math.round(beach.seaTemp.temperature) : null;
  const airTemp = beach.weather ? Math.round(beach.weather.airTemp) : null;
  const wind = beach.weather ? Math.round(beach.weather.windSpeed) : null;
  const windDir = beach.weather?.windDirection ?? '';
  const uv = beach.weather?.uvIndex ?? null;
  const uvInfo = getUvInfo(uv);
  const feelsLike = beach.weather ? Math.round(beach.weather.feelsLike) : null;
  const flag = getFlagInfo(beach.safety?.level);

  return (
    <LinearGradient colors={['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8']} style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{'‹'}</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle} numberOfLines={1}>{beach.name}</Text>
            <Text style={styles.headerSub}>
              {'📍'} {beach.city ?? ''} · {formatDistance(beach.distance)}
            </Text>
          </View>
        </View>

        {/* Sea temp hero circle + flag */}
        <View style={styles.heroRow}>
          <View style={styles.seaCircle}>
            <Text style={styles.seaVal}>{seaTemp != null ? `${seaTemp}°` : '—'}</Text>
            <Text style={styles.seaLabel}>{'🌊'} mer</Text>
          </View>
          <View style={styles.heroPills}>
            {airTemp != null && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{'☀️'} {airTemp}°</Text>
              </View>
            )}
            {wind != null && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{'💨'} {wind} km/h</Text>
              </View>
            )}
            {uv != null && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{'☀️'} UV {Math.round(uv)}</Text>
              </View>
            )}
          </View>
          {/* Flag badge */}
          <View style={[styles.flagBadge, { backgroundColor: flag.color }]}>
            <Text style={styles.flagText}>{'🚩'}</Text>
          </View>
        </View>

        {/* Main conditions card — 3 slot grid */}
        <View style={styles.card}>
          <View style={styles.slotGrid}>
            {/* Temperature */}
            <View style={styles.slotCard}>
              <Text style={styles.slotLabel}>Température</Text>
              <Text style={styles.slotIcon}>{'🌡️'}</Text>
              <Text style={styles.slotValue}>{airTemp != null ? `${airTemp}°` : '—'}</Text>
            </View>
            {/* Wind */}
            <View style={styles.slotCard}>
              <Text style={styles.slotLabel}>Vent</Text>
              <Text style={styles.slotIcon}>{'💨'}</Text>
              <Text style={styles.slotValue}>{wind != null ? `${wind}` : '—'}</Text>
              <Text style={styles.slotUnit}>km/h {windDir}</Text>
            </View>
            {/* Sea */}
            <View style={[styles.slotCard, styles.slotSea]}>
              <Text style={styles.slotLabel}>Mer</Text>
              <Text style={styles.slotIcon}>{'🌊'}</Text>
              <Text style={styles.slotValue}>{seaTemp != null ? `${seaTemp}°` : '—'}</Text>
            </View>
          </View>

          {/* Extra row: UV, Feels like, Visibility */}
          <View style={styles.extraRow}>
            <View style={styles.extraItem}>
              <Text style={[styles.extraValue, { color: uvInfo.color }]}>
                {'☀️'} UV {uv != null ? Math.round(uv) : '—'}
              </Text>
              <Text style={styles.extraLabel}>{uvInfo.text}</Text>
            </View>
            <View style={styles.extraItem}>
              <Text style={styles.extraValue}>
                {'🤒'} {feelsLike != null ? `${feelsLike}°` : '—'}
              </Text>
              <Text style={styles.extraLabel}>Ressenti</Text>
            </View>
            <View style={styles.extraItem}>
              <Text style={styles.extraValue}>
                {beach.weather ? `${beach.weather.visibility} km` : '—'}
              </Text>
              <Text style={styles.extraLabel}>Visibilité</Text>
            </View>
          </View>

          {/* Flag status */}
          <View style={[styles.flagRow, { backgroundColor: flag.color + '18' }]}>
            <View style={[styles.flagDot, { backgroundColor: flag.color }]} />
            <Text style={[styles.flagLabel, { color: flag.color }]}>Drapeau {flag.text}</Text>
          </View>
        </View>

        {/* Badges */}
        {(beach.tags.blueFlag || beach.tags.dog === 'yes' || beach.tags.dog === 'leashed' || beach.tags.supervised) && (
          <View style={styles.card}>
            <View style={styles.badges}>
              {beach.tags.blueFlag && (
                <View style={[styles.badge, { backgroundColor: '#d4edda' }]}>
                  <Text style={styles.badgeText}>{'🏅'} Pavillon Bleu</Text>
                </View>
              )}
              {(beach.tags.dog === 'yes' || beach.tags.dog === 'leashed') && (
                <View style={[styles.badge, { backgroundColor: '#e8d5f5' }]}>
                  <Text style={styles.badgeText}>{'🐕'} {beach.tags.dog === 'leashed' ? 'Chiens en laisse' : 'Chiens OK'}</Text>
                </View>
              )}
              {beach.tags.supervised && (
                <View style={[styles.badge, { backgroundColor: '#e0f7ff' }]}>
                  <Text style={styles.badgeText}>{'🏊'} Surveillée</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Water quality */}
        {waterQuality && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Qualité de l'eau</Text>
            <WaterQualityBadge data={waterQuality} detailed />
          </View>
        )}

        {/* Amenities */}
        {(beach.amenities.showers || beach.amenities.toilets || beach.amenities.parking || beach.amenities.accessible || beach.amenities.lifeguard) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('detail.amenities')}</Text>
            <AmenityTags
              amenities={beach.amenities}
              tags={beach.tags}
              restaurantCount={beach.restaurants.length}
            />
          </View>
        )}

        {/* Restaurants */}
        {beach.restaurants.length > 0 && (
          <View style={styles.card}>
            <RestaurantList restaurants={beach.restaurants} />
          </View>
        )}

        {/* Forecast */}
        {forecast && forecast.length > 0 && (
          <View style={styles.card}>
            <ForecastRow
              forecast={forecast}
              onUnlockDay={() => {}}
            />
          </View>
        )}

        {/* Footnote */}
        <Text style={styles.footnote}>* drapeau et marées estimés algorithmiquement</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#fff', fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 58,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 24, color: '#fff', fontWeight: '300', marginTop: -2 },
  headerRight: { flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // Sea temp hero row
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  seaCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(26,188,156,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  seaVal: { fontSize: 26, fontWeight: '800', color: '#fff', lineHeight: 28 },
  seaLabel: { fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },
  heroPills: { flex: 1, gap: 4 },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  flagBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  flagText: { fontSize: 18 },

  // Cards
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    fontWeight: '700',
  },

  // Slot grid (3 columns)
  slotGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  slotCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  slotSea: {
    backgroundColor: 'rgba(26,188,156,0.06)',
  },
  slotLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A5E9A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  slotIcon: { fontSize: 22, marginBottom: 6 },
  slotValue: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  slotUnit: { fontSize: 10, color: '#888', marginTop: 2 },

  // Extra row
  extraRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  extraItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  extraValue: { fontSize: 14, fontWeight: '600', color: '#444' },
  extraLabel: { fontSize: 10, color: '#999', marginTop: 2 },

  // Flag row
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  flagDot: { width: 12, height: 12, borderRadius: 4 },
  flagLabel: { fontSize: 13, fontWeight: '700' },

  // Badges
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '500', color: '#333' },

  // Footnote
  footnote: {
    textAlign: 'center',
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
    marginTop: 16,
    paddingHorizontal: 20,
  },
});
