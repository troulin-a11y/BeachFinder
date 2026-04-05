import { API, SAFETY_THRESHOLDS } from '../constants';
import type { SafetyData, SafetyLevel } from '../types';

// ---------------------------------------------------------------------------
// Core scoring logic
// ---------------------------------------------------------------------------

/**
 * Computes a safety level from wind speed and optional wave height.
 * Uses SAFETY_THRESHOLDS from constants.
 *
 * @param windSpeedKmh - Wind speed in km/h
 * @param waveHeightM  - Wave height in metres (optional, defaults to 0)
 * @returns SafetyData with level, i18n label/reason keys, and source='computed'
 */
export function computeSafetyScore(
  windSpeedKmh: number,
  waveHeightM: number = 0,
): SafetyData {
  let level: SafetyLevel;

  if (
    windSpeedKmh > SAFETY_THRESHOLDS.WIND_RED ||
    waveHeightM > SAFETY_THRESHOLDS.WAVES_RED
  ) {
    level = 'red';
  } else if (
    windSpeedKmh > SAFETY_THRESHOLDS.WIND_ORANGE ||
    waveHeightM > SAFETY_THRESHOLDS.WAVES_ORANGE
  ) {
    level = 'orange';
  } else {
    level = 'green';
  }

  return {
    level,
    label: `safety.${level}`,
    reason: `safety.${level}Reason`,
    source: 'computed',
  };
}

// ---------------------------------------------------------------------------
// NOAA advisory types (internal)
// ---------------------------------------------------------------------------

interface NoaaAdvisory {
  hazardType?: string;
  significance?: string; // 'W' (Warning), 'A' (Watch), 'Y' (Advisory)
}

interface NoaaAlertResponse {
  features?: Array<{ properties: NoaaAdvisory }>;
}

// ---------------------------------------------------------------------------
// NOAA fetch helper
// ---------------------------------------------------------------------------

/**
 * Attempts to fetch a safety level from NOAA weather alerts for US beaches.
 * Returns null if the request fails or no relevant alerts are found.
 */
async function fetchNoaaSafety(lat: number, lng: number): Promise<SafetyData | null> {
  try {
    // NOAA Weather API — active alerts for a point
    const url = `https://api.weather.gov/alerts/active?point=${lat},${lng}&status=actual`;
    const response = await fetch(url, {
      headers: { Accept: 'application/geo+json', 'User-Agent': 'BeachFinder/1.0' },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as NoaaAlertResponse;
    const features = data.features ?? [];

    if (features.length === 0) return null;

    // Determine the most severe level from active alerts
    let hasWarning = false;
    let hasAdvisory = false;

    for (const f of features) {
      const sig = f.properties.significance;
      const hazard = (f.properties.hazardType ?? '').toLowerCase();
      // Focus on beach/marine/wind/rip-current relevant hazards
      const isRelevant =
        hazard.includes('rip') ||
        hazard.includes('beach') ||
        hazard.includes('wind') ||
        hazard.includes('surf') ||
        hazard.includes('coastal') ||
        hazard.includes('marine');

      if (!isRelevant && hazard.length > 0) continue;

      if (sig === 'W') hasWarning = true;
      else if (sig === 'A' || sig === 'Y') hasAdvisory = true;
    }

    if (hasWarning) {
      return {
        level: 'red',
        label: 'safety.red',
        reason: 'safety.redReason',
        source: 'noaa',
      };
    }

    if (hasAdvisory) {
      return {
        level: 'orange',
        label: 'safety.orange',
        reason: 'safety.orangeReason',
        source: 'noaa',
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Fetches or computes a SafetyData for a given beach location.
 *
 * For US beaches, attempts a NOAA advisory lookup first.
 * Falls back to a computed score derived from wind and wave thresholds.
 *
 * @param lat           - Beach latitude
 * @param lng           - Beach longitude
 * @param windSpeedKmh  - Current wind speed in km/h
 * @param isUS          - Whether the beach is on US coast
 */
export async function fetchSafety(
  lat: number,
  lng: number,
  windSpeedKmh: number,
  isUS: boolean,
): Promise<SafetyData> {
  if (isUS) {
    const noaaResult = await fetchNoaaSafety(lat, lng);
    if (noaaResult) return noaaResult;
  }

  return computeSafetyScore(windSpeedKmh);
}
