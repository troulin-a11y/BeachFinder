import { API } from '../constants';
import { supabase } from '../lib/supabase';
import type { SeaTempData } from '../types';

// ---------------------------------------------------------------------------
// US coast bounding boxes
// ---------------------------------------------------------------------------

/** Returns true if the coordinate falls within continental US, Alaska, or Hawaii. */
export function isUSCoast(lat: number, lng: number): boolean {
  // Continental US
  if (lat >= 24.5 && lat <= 49.5 && lng >= -125.0 && lng <= -66.9) return true;
  // Alaska
  if (lat >= 51.2 && lat <= 71.5 && lng >= -180.0 && lng <= -129.9) return true;
  // Hawaii
  if (lat >= 18.9 && lat <= 22.3 && lng >= -160.3 && lng <= -154.8) return true;
  return false;
}

// ---------------------------------------------------------------------------
// NOAA CO-OPS parser
// ---------------------------------------------------------------------------

interface NoaaObservation {
  t: string; // timestamp
  v: string; // value
  f: string; // flags
}

interface NoaaWaterTempResponse {
  data?: NoaaObservation[];
  error?: { message: string };
}

/** Parses the NOAA CO-OPS JSON response and returns the latest temperature in °C, or null. */
export function parseNoaaWaterTemp(response: NoaaWaterTempResponse): number | null {
  if (!response.data || response.data.length === 0) return null;

  // Observations are in chronological order; take the last valid reading
  for (let i = response.data.length - 1; i >= 0; i--) {
    const obs = response.data[i];
    const value = parseFloat(obs.v);
    if (!isNaN(value)) return value;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

/**
 * Attempts to fetch water temperature from the nearest NOAA CO-OPS station.
 * Returns a SeaTempData on success, null otherwise.
 */
async function fetchNoaaSeaTemp(lat: number, lng: number): Promise<SeaTempData | null> {
  try {
    // Step 1: find the nearest NOAA station
    const stationsUrl = new URL(API.NOAA_STATIONS_URL);
    stationsUrl.searchParams.set('type', 'watertemp');
    stationsUrl.searchParams.set('units', 'metric');

    const stationsRes = await fetch(stationsUrl.toString());
    if (!stationsRes.ok) return null;

    interface NoaaStation {
      id: string;
      name: string;
      lat: number;
      lng: number;
    }
    interface NoaaStationsResponse {
      stations: NoaaStation[];
    }

    const stationsData = (await stationsRes.json()) as NoaaStationsResponse;
    const stations: NoaaStation[] = stationsData.stations ?? [];

    if (stations.length === 0) return null;

    // Find nearest station using simple Euclidean distance (sufficient for proximity)
    let nearest: NoaaStation | null = null;
    let minDist = Infinity;
    for (const s of stations) {
      const d =
        (s.lat - lat) * (s.lat - lat) + (s.lng - lng) * (s.lng - lng);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    }

    if (!nearest) return null;

    // Step 2: fetch latest water temperature for that station
    const dataUrl = new URL(API.NOAA_COOPS_URL);
    dataUrl.searchParams.set('product', 'water_temperature');
    dataUrl.searchParams.set('station', nearest.id);
    dataUrl.searchParams.set('date', 'latest');
    dataUrl.searchParams.set('datum', 'MLLW');
    dataUrl.searchParams.set('units', 'metric');
    dataUrl.searchParams.set('time_zone', 'gmt');
    dataUrl.searchParams.set('application', 'BeachFinder');
    dataUrl.searchParams.set('format', 'json');

    const dataRes = await fetch(dataUrl.toString());
    if (!dataRes.ok) return null;

    const tempData = (await dataRes.json()) as NoaaWaterTempResponse;
    const temperature = parseNoaaWaterTemp(tempData);
    if (temperature === null) return null;

    return {
      temperature,
      source: 'noaa',
      stationName: nearest.name,
    };
  } catch {
    return null;
  }
}

/**
 * Main orchestrator for sea temperature.
 *
 * Priority:
 * 1. Supabase cached SST (find_nearest_sst RPC)
 * 2. NOAA CO-OPS (US coasts only)
 * 3. Return null (Copernicus data is populated by an edge function)
 */
export async function fetchSeaTemperature(
  lat: number,
  lng: number,
): Promise<SeaTempData | null> {
  // 1. Try Supabase cached SST first
  try {
    const { data, error } = await supabase.rpc('find_nearest_sst', {
      p_lat: lat,
      p_lng: lng,
    });

    if (!error && data && typeof data === 'object') {
      const record = data as { temperature: number; source: 'noaa' | 'copernicus'; station_name?: string };
      if (typeof record.temperature === 'number') {
        return {
          temperature: record.temperature,
          source: record.source,
          stationName: record.station_name,
        };
      }
    }
  } catch {
    // Supabase unavailable — continue to fallbacks
  }

  // 2. NOAA for US coasts
  if (isUSCoast(lat, lng)) {
    const noaaResult = await fetchNoaaSeaTemp(lat, lng);
    if (noaaResult) return noaaResult;
  }

  // 3. Copernicus will be handled by the edge function; return null for now
  return null;
}
