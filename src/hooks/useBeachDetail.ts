import { useState, useEffect } from 'react';
import type { EnrichedBeach, ForecastDay, WaterQualityData } from '../types';
import { fetchForecast } from '../api/weather';
import { fetchWaterQuality } from '../api/waterQuality';

interface UseBeachDetailResult {
  forecast: ForecastDay[] | null;
  waterQuality: WaterQualityData | null;
  loading: boolean;
}

export function useBeachDetail(beach: EnrichedBeach | null): UseBeachDetailResult {
  const [forecast, setForecast] = useState<ForecastDay[] | null>(null);
  const [waterQuality, setWaterQuality] = useState<WaterQualityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!beach) return;
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      const { latitude: lat, longitude: lng } = beach!.location;

      const [forecastResult, wqResult] = await Promise.allSettled([
        fetchForecast(lat, lng),
        fetchWaterQuality(lat, lng),
      ]);

      if (cancelled) return;

      if (forecastResult.status === 'fulfilled') {
        // Merge sea temp into forecast days
        const days = forecastResult.value.forecast.map((d) => ({
          ...d,
          seaTemp: beach!.seaTemp?.temperature ?? null,
        }));
        setForecast(days);
      }

      if (wqResult.status === 'fulfilled') {
        setWaterQuality(wqResult.value);
      }

      setLoading(false);
    }

    loadDetail();
    return () => { cancelled = true; };
  }, [beach?.osmId]);

  return { forecast, waterQuality, loading };
}
