import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyBeaches } from '../../hooks/useNearbyBeaches';
import { BeachCard } from '../../components/BeachCard';

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { location } = useLocation();
  const { beaches } = useNearbyBeaches(location);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(filter) ? next.delete(filter) : next.add(filter);
      return next;
    });
  };

  const filtered = beaches.filter((b) => {
    const matchesQuery =
      !query ||
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      (b.city ?? '').toLowerCase().includes(query.toLowerCase());

    const matchesFilters =
      (!activeFilters.has('blueFlag') || b.tags.blueFlag) &&
      (!activeFilters.has('seaTemp') || (b.seaTemp && b.seaTemp.temperature >= 20)) &&
      (!activeFilters.has('lowWind') || (b.weather && b.weather.windSpeed < 15)) &&
      (!activeFilters.has('excellentWater') || (b.waterQuality?.classification === 'excellent'));

    return matchesQuery && matchesFilters;
  });

  const filters = [
    { key: 'blueFlag', label: t('search.filters.blueFlag') },
    { key: 'seaTemp', label: t('search.filters.seaTemp') },
    { key: 'lowWind', label: t('search.filters.lowWind') },
    { key: 'excellentWater', label: t('search.filters.excellentWater') },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text>{'\uD83D\uDD0D'}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('search.placeholder')}
          placeholderTextColor="#6b8aaa"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.filters}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, activeFilters.has(f.key) && styles.chipActive]}
            onPress={() => toggleFilter(f.key)}
          >
            <Text style={[styles.chipText, activeFilters.has(f.key) && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.osmId}
        renderItem={({ item, index }) => (
          <BeachCard
            beach={item}
            onPress={() => router.push({ pathname: '/beach/[id]', params: { id: item.osmId, index: String(index) } })}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', paddingTop: 60 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    backgroundColor: '#132238',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 15, color: '#fff' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, marginBottom: 12 },
  chip: { backgroundColor: '#1e3a5f', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  chipActive: { backgroundColor: '#3b82f6' },
  chipText: { fontSize: 11, color: '#a5b4c4' },
  chipTextActive: { color: '#fff' },
  list: { padding: 12, paddingBottom: 100 },
});
