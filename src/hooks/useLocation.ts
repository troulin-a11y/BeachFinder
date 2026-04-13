import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from '../types';

interface UseLocationResult {
  location: Coordinates | null;
  error: string | null;
  loading: boolean;
  retry: () => void;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchLocation() {
      setLoading(true);
      setError(null);

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setError('permission_denied');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!cancelled) {
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch (e) {
        if (!cancelled) setError('location_error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLocation();
    return () => { cancelled = true; };
  }, [retryCount]);

  return {
    location,
    error,
    loading,
    retry: () => setRetryCount((c) => c + 1),
  };
}
