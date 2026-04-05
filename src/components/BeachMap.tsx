import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Coordinates, EnrichedBeach } from '../types';

const PIN_COLORS = {
  green: '#22c55e',
  orange: '#f59e0b',
  red: '#ef4444',
};

interface Props {
  userLocation: Coordinates;
  beaches: EnrichedBeach[];
  onBeachPress: (index: number) => void;
}

export function BeachMap({ userLocation, beaches, onBeachPress }: Props) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }}
      showsUserLocation
      showsMyLocationButton
    >
      {beaches.map((beach, index) => (
        <Marker
          key={beach.osmId}
          coordinate={beach.location}
          title={beach.name}
          description={
            beach.seaTemp
              ? `${Math.round(beach.seaTemp.temperature)}\u00b0C`
              : undefined
          }
          pinColor={PIN_COLORS[beach.safety?.level ?? 'green']}
          onCalloutPress={() => onBeachPress(index)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: 200, borderRadius: 0 },
});
