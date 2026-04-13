import React, { useState, useRef } from 'react';
import { View, FlatList, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyBeaches } from '../../hooks/useNearbyBeaches';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import { BeachCard } from '../../components/BeachCard';
import type { Coordinates, EnrichedBeach } from '../../types';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { location, error: locError, loading: locLoading } = useLocation();
  const [searchLocation, setSearchLocation] = useState<Coordinates | null>(null);
  const [searchLabel, setSearchLabel] = useState('');
  const activeLocation = searchLocation ?? location;
  const { beaches, loading, error } = useNearbyBeaches(activeLocation);
  const listRef = useRef<FlatList>(null);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, loading: sugLoading } = useSearchSuggestions(query);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(filter) ? next.delete(filter) : next.add(filter);
      return next;
    });
  };

  const handleSuggestionPress = (s: typeof suggestions[0]) => {
    setSearchLocation({ latitude: s.latitude, longitude: s.longitude });
    setSearchLabel(s.displayName);
    setQuery(s.displayName);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleClearSearch = () => {
    setSearchLocation(null);
    setSearchLabel('');
    setQuery('');
    setShowSuggestions(false);
  };

  const filtered = beaches.filter((b) => {
    // If user typed text but didn't pick a suggestion, filter locally by name
    const matchesQuery =
      !query || searchLocation != null ||
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
    { key: 'blueFlag', label: '🏅 Pavillon Bleu' },
    { key: 'seaTemp', label: '🌊 ≥20°C' },
    { key: 'lowWind', label: '💨 <15 km/h' },
    { key: 'excellentWater', label: '✅ Eau excellente' },
  ];

  const handleBeachPress = (beach: EnrichedBeach, index: number) => {
    router.push({ pathname: '/beach/[id]', params: { id: beach.osmId, index: String(index) } });
  };

  if (locLoading || (loading && beaches.length === 0 && !searchLocation)) {
    return (
      <LinearGradient colors={['#0077b6', '#00b4d8', '#90e0ef']} style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Recherche des plages...</Text>
        <Text style={[styles.loadingText, { fontSize: 12, marginTop: 4, opacity: 0.7 }]}>
          Localisation + Overpass API
        </Text>
      </LinearGradient>
    );
  }

  if (locError && !searchLocation) {
    return (
      <LinearGradient colors={['#0077b6', '#00b4d8', '#90e0ef']} style={styles.center}>
        <Text style={styles.errorEmoji}>{"📍"}</Text>
        <Text style={styles.errorText}>{t('errors.noGps')}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{"🏖️ BeachFinder"}</Text>
        {searchLabel ? (
          <TouchableOpacity style={styles.locationBadge} onPress={handleClearSearch}>
            <Text style={styles.locationText}>{"📍"} {searchLabel.split(',')[0]}  ✕</Text>
          </TouchableOpacity>
        ) : activeLocation && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>
              {"📍"} {activeLocation.latitude.toFixed(3)}, {activeLocation.longitude.toFixed(3)}
            </Text>
          </View>
        )}
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>{"🔍"}</Text>
        <TextInput
          style={styles.input}
          placeholder="Rechercher une plage ou une ville..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setShowSuggestions(true);
            if (!text) handleClearSearch();
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Autocomplete suggestions */}
      {showSuggestions && query.length >= 2 && (
        <View style={styles.suggestionsContainer}>
          {sugLoading && (
            <View style={styles.suggestionItem}>
              <Text style={styles.suggestionLoading}>Recherche...</Text>
            </View>
          )}
          {suggestions.map((s, i) => (
            <TouchableOpacity
              key={`${s.latitude}-${s.longitude}-${i}`}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(s)}
            >
              <Text style={styles.suggestionIcon}>
                {s.type === 'beach' ? '🏖️' : s.type === 'water' ? '💧' : '📍'}
              </Text>
              <Text style={styles.suggestionText} numberOfLines={1}>{s.displayName}</Text>
            </TouchableOpacity>
          ))}
          {!sugLoading && suggestions.length === 0 && query.length >= 3 && (
            <View style={styles.suggestionItem}>
              <Text style={styles.suggestionLoading}>Aucun résultat</Text>
            </View>
          )}
        </View>
      )}

      {/* Filter chips */}
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

      {/* Loading indicator for new search location */}
      {loading && searchLocation && (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.loadingText}>{"Recherche des plages..."}</Text>
        </View>
      )}

      {/* Beach list */}
      {error === 'no_beaches' && !loading ? (
        <View style={[styles.center, { flex: 0, paddingVertical: 40 }]}>
          <Text style={styles.emptyText}>{"🔍 Aucune plage trouvée"}</Text>
          {searchLocation && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.resetBtn}>
              <Text style={styles.resetText}>{"Revenir à ma position"}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={filtered}
          keyExtractor={(b) => b.osmId}
          renderItem={({ item, index }) => (
            <BeachCard beach={item} onPress={() => handleBeachPress(item, index)} />
          )}
          style={{ flex: 1 }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => { setShowSuggestions(false); Keyboard.dismiss(); }}
          ListHeaderComponent={
            loading && beaches.length > 0 ? (
              <View style={styles.enriching}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.enrichingText}>Chargement des infos...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Text style={styles.emptyText}>{"🔍 Aucun résultat"}</Text>
              </View>
            ) : null
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  locationBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  locationText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
    padding: 12,
    paddingHorizontal: 16,
    marginBottom: 0,
    zIndex: 10,
  },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: 15, color: '#333' },
  clearBtn: { fontSize: 16, color: '#999', paddingHorizontal: 4 },
  // Suggestions dropdown
  suggestionsContainer: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 20,
    marginBottom: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    gap: 10,
  },
  suggestionIcon: { fontSize: 16 },
  suggestionText: { flex: 1, fontSize: 14, color: '#333' },
  suggestionLoading: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  // Filters
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chipActive: { backgroundColor: '#fff' },
  chipText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  chipTextActive: { color: '#0077b6' },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 14 },
  errorEmoji: { fontSize: 48, marginBottom: 12 },
  errorText: { color: '#fff', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  enriching: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  enrichingText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  list: { padding: 20, paddingBottom: 100 },
  resetBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resetText: { color: '#fff', fontSize: 13, fontWeight: '500' },
});
