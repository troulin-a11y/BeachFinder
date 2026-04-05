import { useState, useEffect, useCallback } from 'react';
import type { Coordinates, Beach, EnrichedBeach, Amenities } from '../types';
import { localCache } from '../lib/cache';
import { CACHE_TTL, SEARCH_RADIUS_M, SEARCH_RADIUS_EXPANDED_M } from '../constants';
import { fetchNearbyBeaches, fetchBeachAmenities } from '../api/overpass';
import { fetchCurrentWeather } from '../api/weather';
import { fetchSeaTemperature } from '../api/seaTemp';
import { computeSafetyScore } from '../api/safety';
import { fetchBeachPhoto } from '../api/photos';
import { checkBlueFlag } from '../api/waterQuality';

interface UseNearbyBeachesResult {
  beaches: EnrichedBeach[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const EMPTY_AMENITIES: Amenities = {
  showers: false, toilets: false, parking: false, accessible: false, lifeguard: false,
};

export function useNearbyBeaches(location: Coordinates | null): UseNearbyBeachesResult {
  const [beaches, setBeaches] = useState<EnrichedBeach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const { latitude: lat, longitude: lng } = location!;
        const cacheKey = `beaches_${lat.toFixed(2)}_${lng.toFixed(2)}`;

        // L2 cache check
        const cachedBeaches = await localCache.get<Beach[]>(cacheKey);
        let rawBeaches: Beach[];

        if (cachedBeaches && cachedBeaches.length > 0) {
          rawBeaches = cachedBeaches;
        } else {
          rawBeaches = await fetchNearbyBeaches(lat, lng, SEARCH_RADIUS_M);

          // Expand search if too few results
          if (rawBeaches.length === 0) {
            rawBeaches = await fetchNearbyBeaches(lat, lng, SEARCH_RADIUS_EXPANDED_M);
          }

          if (rawBeaches.length > 0) {
            await localCache.set(cacheKey, rawBeaches, CACHE_TTL.BEACHES);
          }
        }

        if (cancelled) return;

        if (rawBeaches.length === 0) {
          setBeaches([]);
          setError('no_beaches');
          return;
        }

        // Start with basic data, enrich progressively
        const initial: EnrichedBeach[] = rawBeaches.map((b) => ({
          ...b,
          weather: null,
          seaTemp: null,
          safety: null,
          photo: null,
          waterQuality: null,
          amenities: EMPTY_AMENITIES,
          restaurants: [],
          forecast: null,
        }));

        setBeaches(initial);

        // Enrich in parallel (weather + photo for each beach)
        // Use Promise.allSettled at outer level so one beach failure doesn't discard all
        const results = await Promise.allSettled(
          initial.map(async (beach) => {
            const [weather, seaTemp, photo, amenityData, blueFlagResult] = await Promise.allSettled([
              fetchCurrentWeather(beach.location.latitude, beach.location.longitude),
              fetchSeaTemperature(beach.location.latitude, beach.location.longitude),
              fetchBeachPhoto(
                beach.osmId,
                beach.location.latitude,
                beach.location.longitude,
                beach.name,
              ),
              fetchBeachAmenities(beach.location.latitude, beach.location.longitude),
              beach.tags.blueFlag
                ? Promise.resolve(true)
                : checkBlueFlag(beach.osmId, beach.location.latitude, beach.location.longitude),
            ]);

            const weatherData = weather.status === 'fulfilled' ? weather.value : null;
            const seaTempData = seaTemp.status === 'fulfilled' ? seaTemp.value : null;
            const photoData = photo.status === 'fulfilled' ? photo.value : null;
            const amenities = amenityData.status === 'fulfilled' ? amenityData.value : { amenities: EMPTY_AMENITIES, restaurants: [] };
            const blueFlag = blueFlagResult.status === 'fulfilled' ? blueFlagResult.value : beach.tags.blueFlag;

            const safety = weatherData
              ? computeSafetyScore(weatherData.windSpeed)
              : null;

            return {
              ...beach,
              tags: { ...beach.tags, blueFlag },
              weather: weatherData,
              seaTemp: seaTempData,
              safety,
              photo: photoData,
              waterQuality: null, // loaded on detail view
              amenities: {
                ...amenities.amenities,
                accessible: beach.tags.wheelchair,
                lifeguard: beach.tags.supervised,
              },
              restaurants: amenities.restaurants,
              forecast: null, // loaded on detail view
            } satisfies EnrichedBeach;
          }),
        );

        // Merge: keep initial data for beaches whose enrichment failed
        if (!cancelled) {
          setBeaches(initial.map((b, i) =>
            results[i].status === 'fulfilled'
              ? (results[i] as PromiseFulfilledResult<EnrichedBeach>).value
              : b,
          ));
        }
      } catch (e) {
        if (!cancelled) setError('fetch_error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [location, refreshKey]);

  return { beaches, loading, error, refresh };
}
