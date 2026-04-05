import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<Array<{ osm_id: string; beach_name: string }>>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('favorites')
        .select('osm_id, beach_name, lat, lng')
        .order('created_at', { ascending: false });
      if (data) setFavorites(data);
    }
    load();
  }, []);

  if (favorites.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>{'\u2B50'}</Text>
        <Text style={styles.emptyText}>{t('favorites.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('favorites.title')}</Text>
      <FlatList
        data={favorites}
        keyExtractor={(f) => f.osm_id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.beach_name ?? item.osm_id}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1628' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#6b8aaa', fontSize: 14 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', padding: 16 },
  list: { padding: 16 },
  item: {
    backgroundColor: '#132238',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  name: { fontSize: 14, color: '#fff' },
});
