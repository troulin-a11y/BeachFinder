import React, { useRef } from 'react';
import { View, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyBeaches } from '../../hooks/useNearbyBeaches';
import { BeachMap } from '../../components/BeachMap';
import { BeachCard } from '../../components/BeachCard';
import type { EnrichedBeach } from '../../types';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { location, error: locError, loading: locLoading } = useLocation();
  const { beaches, loading, error } = useNearbyBeaches(location);
  const listRef = useRef<FlatList>(null);

  const handleBeachPress = (beach: EnrichedBeach, index: number) => {
    router.push({ pathname: '/beach/[id]', params: { id: beach.osmId, index: String(index) } });
  };

  const handleMapBeachPress = (index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
  };

  if (locLoading || (loading && beaches.length === 0)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{t('home.title')}...</Text>
      </View>
    );
  }

  if (locError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('errors.noGps')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location && (
        <BeachMap
          userLocation={location}
          beaches={beaches}
          onBeachPress={handleMapBeachPress}
        />
      )}

      {error === 'no_beaches' ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('home.noBeaches')}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={beaches}
          keyExtractor={(b) => b.osmId}
          renderItem={({ item, index }) => (
            <BeachCard beach={item} onPress={() => handleBeachPress(item, index)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1628' },
  loadingText: { color: '#6b8aaa', marginTop: 12, fontSize: 14 },
  errorText: { color: '#f59e0b', fontSize: 14, textAlign: 'center', padding: 20 },
  emptyText: { color: '#6b8aaa', fontSize: 14 },
  list: { padding: 12, paddingBottom: 100 },
});
