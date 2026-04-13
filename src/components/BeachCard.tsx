import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import type { EnrichedBeach } from '../types';
import { formatDistance } from '../utils/distance';

const fallbackImage = require('../../assets/images/beach-fallback.jpg');

interface Props {
  beach: EnrichedBeach;
  onPress: () => void;
}

function getFlagColor(level?: string) {
  if (level === 'red') return '#E74C3C';
  if (level === 'orange') return '#F1C40F';
  return '#27AE60';
}

function getUvLabel(uv: number) {
  if (uv <= 2) return { text: `UV ${Math.round(uv)}`, color: '#27ae60' };
  if (uv <= 5) return { text: `UV ${Math.round(uv)}`, color: '#f39c12' };
  if (uv <= 7) return { text: `UV ${Math.round(uv)}`, color: '#e67e22' };
  return { text: `UV ${Math.round(uv)}`, color: '#e74c3c' };
}

export function BeachCard({ beach, onPress }: Props) {
  const seaTemp = beach.seaTemp ? Math.round(beach.seaTemp.temperature) : null;
  const airTemp = beach.weather ? Math.round(beach.weather.airTemp) : null;
  const wind = beach.weather ? Math.round(beach.weather.windSpeed) : null;
  const uv = beach.weather?.uvIndex;
  const flagColor = getFlagColor(beach.safety?.level);
  const photoSource = beach.photo && !beach.photo.isFallback
    ? { uri: beach.photo.url }
    : fallbackImage;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <ImageBackground source={photoSource} style={styles.bg} imageStyle={styles.bgImage}>
        {/* Gradient overlay */}
        <View style={styles.gradient} />

        {/* Sea temp circle (top-left) */}
        <View style={styles.seaHero}>
          <View style={[styles.seaCircle, seaTemp == null && styles.seaCircleNA]}>
            <Text style={styles.seaVal}>{seaTemp != null ? `${seaTemp}°` : '—'}</Text>
            <Text style={styles.seaLabel}>{"🌊"} mer</Text>
          </View>
          {/* Info pills */}
          <View style={styles.pillCol}>
            {airTemp != null && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{"☀️"} {airTemp}°</Text>
              </View>
            )}
            {wind != null && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{"💨"} {wind} km/h</Text>
              </View>
            )}
          </View>
        </View>

        {/* Flag badge (top-right) */}
        <View style={[styles.flagBadge, { backgroundColor: flagColor }]}>
          <Text style={styles.flagIcon}>{"🚩"}</Text>
        </View>

        {/* Bottom info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{beach.name}</Text>
          <Text style={styles.dist}>{"📍"} {formatDistance(beach.distance)}</Text>
          {/* UV pill */}
          {uv != null && uv > 0 && (
            <View style={styles.pillRow}>
              <View style={[styles.uvPill, { backgroundColor: 'rgba(243,156,18,0.18)' }]}>
                <Text style={[styles.pillText, { color: getUvLabel(uv).color }]}>
                  {"☀️"} {getUvLabel(uv).text}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    height: 260,
    marginBottom: 14,
    backgroundColor: '#0a5e7d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 28,
    elevation: 6,
  },
  bg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bgImage: {
    borderRadius: 22,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    backgroundColor: 'transparent',
  },

  // Sea temp hero (top-left)
  seaHero: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 3,
  },
  seaCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(26,188,156,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  seaCircleNA: {
    backgroundColor: 'rgba(120,120,140,0.6)',
  },
  seaVal: { fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 24 },
  seaLabel: { fontSize: 7, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 },

  pillCol: { gap: 3 },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: { fontSize: 10, fontWeight: '600', color: '#fff' },

  // Flag badge (top-right)
  flagBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 2,
  },
  flagIcon: { fontSize: 17 },

  // Bottom info
  info: {
    padding: 14,
    paddingTop: 60,
    backgroundColor: 'rgba(4,12,28,0.65)',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    lineHeight: 26,
  },
  dist: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3, fontWeight: '400' },
  pillRow: { flexDirection: 'row', gap: 5, marginTop: 8, flexWrap: 'wrap' },
  uvPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
