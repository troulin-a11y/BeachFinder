import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PhotoData } from '../types';

const fallbackImage = require('../../assets/images/beach-fallback.jpg');

interface Props {
  photo: PhotoData | null;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export function PhotoWithFallback({ photo, style, imageStyle }: Props) {
  const { t } = useTranslation();
  const [error, setError] = useState(false);

  const showFallback = !photo || photo.isFallback || error;
  const source = showFallback
    ? fallbackImage
    : { uri: photo!.url };

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={[styles.image, imageStyle]}
        resizeMode="cover"
        onError={() => setError(true)}
      />
      {showFallback && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('photo.nonContractuelle')}</Text>
        </View>
      )}
      {!showFallback && photo?.attribution && (
        <View style={styles.attribution}>
          <Text style={styles.attributionText}>{photo.attribution}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { fontSize: 8, color: '#fff' },
  attribution: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  attributionText: { fontSize: 7, color: '#ccc' },
});
