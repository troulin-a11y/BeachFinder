import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useNearbyBeaches } from '../../hooks/useNearbyBeaches';
import { useBeachDetail } from '../../hooks/useBeachDetail';
import { useLocation } from '../../hooks/useLocation';
import { PhotoWithFallback } from '../../components/PhotoWithFallback';
import { MetricsRow } from '../../components/MetricsRow';
import { SafetyBanner } from '../../components/SafetyBanner';
import { AmenityTags } from '../../components/AmenityTags';
import { RestaurantList } from '../../components/RestaurantList';
import { WaterQualityBadge } from '../../components/WaterQualityBadge';
import { ForecastRow } from '../../components/ForecastRow';
import { formatDistance } from '../../utils/distance';

const { width } = Dimensions.get('window');

export default function BeachDetailScreen() {
  const { id, index } = useLocalSearchParams<{ id: string; index: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { location } = useLocation();
  const { beaches } = useNearbyBeaches(location);
  const beach = beaches[parseInt(index ?? '0', 10)] ?? null;
  const { forecast, waterQuality } = useBeachDetail(beach);

  if (!beach) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{t('errors.noData')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Hero photo */}
      <View style={styles.hero}>
        <PhotoWithFallback
          photo={beach.photo}
          style={styles.heroPhoto}
          imageStyle={{ width, height: 200 }}
        />
        <View style={styles.heroOverlay}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{'\u2190'} {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.heroName}>{beach.name}</Text>
          <Text style={styles.heroLocation}>
            {beach.city} \u00b7 {formatDistance(beach.distance)}
          </Text>
        </View>
        {/* Badges */}
        <View style={styles.heroBadges}>
          {beach.tags.blueFlag && (
            <View style={styles.badgeBlue}><Text style={styles.badgeText}>{'\uD83C\uDFC5'} {t('detail.blueFlag')}</Text></View>
          )}
          {(beach.tags.dog === 'yes' || beach.tags.dog === 'leashed') && (
            <View style={styles.badgeDog}><Text style={styles.badgeText}>{'\uD83D\uDC15'}</Text></View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {/* Key metrics */}
        <MetricsRow weather={beach.weather} seaTemp={beach.seaTemp} />

        {/* Safety banner */}
        <SafetyBanner safety={beach.safety} />

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('detail.amenities')}</Text>
          <AmenityTags
            amenities={beach.amenities}
            tags={beach.tags}
            restaurantCount={beach.restaurants.length}
          />
        </View>

        {/* Restaurants */}
        <RestaurantList restaurants={beach.restaurants} />

        {/* Water quality */}
        {waterQuality && (
          <View style={[styles.section, styles.sectionBox]}>
            <Text style={styles.sectionTitle}>{t('detail.waterQuality')}</Text>
            <WaterQualityBadge data={waterQuality} detailed />
          </View>
        )}

        {/* Blue Flag */}
        {beach.tags.blueFlag && (
          <View style={styles.blueFlagBanner}>
            <Text style={styles.blueFlagTitle}>{'\uD83C\uDFC5'} {t('detail.blueFlag')} 2025</Text>
            <Text style={styles.blueFlagDesc}>{t('detail.blueFlagDesc')}</Text>
          </View>
        )}

        {/* Forecast */}
        {forecast && (
          <ForecastRow
            forecast={forecast}
            onUnlockDay={() => {
              // Ad gate integration handled by AdGate component
            }}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1628' },
  text: { color: '#fff' },
  hero: { height: 200, position: 'relative' },
  heroPhoto: { width: '100%', height: 200 },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backBtn: { position: 'absolute', top: 50, left: 12 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  heroName: { fontSize: 18, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  heroLocation: { fontSize: 11, color: '#ddd' },
  heroBadges: { position: 'absolute', top: 50, right: 8, flexDirection: 'row', gap: 4 },
  badgeBlue: { backgroundColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeDog: { backgroundColor: '#8b5cf6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, color: '#fff' },
  content: { padding: 12, gap: 12 },
  section: { gap: 8 },
  sectionBox: { backgroundColor: '#132238', borderRadius: 8, padding: 10 },
  sectionTitle: { fontSize: 10, color: '#6b8aaa', textTransform: 'uppercase' },
  blueFlagBanner: {
    backgroundColor: '#3b82f622',
    borderWidth: 1,
    borderColor: '#3b82f644',
    borderRadius: 8,
    padding: 10,
  },
  blueFlagTitle: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
  blueFlagDesc: { fontSize: 9, color: '#6b8aaa', marginTop: 4 },
});
