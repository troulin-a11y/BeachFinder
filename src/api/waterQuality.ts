import { API } from '../constants';
import { supabase } from '../lib/supabase';
import { isUSCoast } from './seaTemp';
import type { WaterQualityData } from '../types';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type Classification = 'excellent' | 'good' | 'sufficient' | 'poor';

export function classificationToGrade(raw: string): Classification | null {
  const map: Record<string, Classification> = {
    excellent: 'excellent',
    good: 'good',
    sufficient: 'sufficient',
    poor: 'poor',
  };
  return map[raw.toLowerCase()] ?? null;
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

export function parseEEAResponse(response: any): WaterQualityData | null {
  const results = response?.results ?? [];
  if (results.length === 0) return null;

  const latest = results[0];
  return {
    classification: classificationToGrade(latest.classification) ?? null,
    ecoli: latest.ecoli ?? null,
    enterococci: latest.enterococci ?? null,
    source: 'eea',
    year: latest.year ?? new Date().getFullYear(),
  };
}

// ---------------------------------------------------------------------------
// Data sources
// ---------------------------------------------------------------------------

async function fetchEEAWaterQuality(lat: number, lng: number): Promise<WaterQualityData | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    // EEA DISCODATA query for nearest bathing water site
    const sql = encodeURIComponent(
      `SELECT TOP 1 classification, year, ecoli, enterococci FROM [WISE_Bathing_Water_Quality_By_Site] WHERE ABS(lat - ${lat}) < 0.1 AND ABS(lon - ${lng}) < 0.1 ORDER BY year DESC`,
    );
    const url = `${API.EEA_DISCODATA_URL}?query=${sql}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return parseEEAResponse(data);
  } catch {
    return null;
  }
}

async function fetchEPAWaterQuality(lat: number, lng: number): Promise<WaterQualityData | null> {
  try {
    const url = `${API.EPA_BEACON_URL}/beaches.json?lat=${lat}&lng=${lng}&radius=10`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const beach = data?.features?.[0]?.properties;

    if (!beach) return null;
    return {
      classification: beach.advisory === 'N' ? 'good' : 'poor',
      ecoli: null,
      enterococci: null,
      source: 'epa',
      year: new Date().getFullYear(),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main fetch (cache -> source -> store)
// ---------------------------------------------------------------------------

export async function fetchWaterQuality(lat: number, lng: number): Promise<WaterQualityData | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // Check Supabase cache (annual data)
  try {
    const { data: cached } = await supabase
      .from('water_quality')
      .select('*')
      .gte('lat', lat - 0.05)
      .lte('lat', lat + 0.05)
      .gte('lng', lng - 0.05)
      .lte('lng', lng + 0.05)
      .order('year', { ascending: false })
      .limit(1)
      .single();

    if (cached && cached.year >= new Date().getFullYear() - 1) {
      return {
        classification: cached.classification as WaterQualityData['classification'],
        ecoli: cached.ecoli,
        enterococci: cached.enterococci,
        source: cached.source as 'eea' | 'epa',
        year: cached.year,
      };
    }
  } catch {
    // Supabase unavailable — continue to fresh fetch
  }

  // Fetch fresh data
  const result = isUSCoast(lat, lng)
    ? await fetchEPAWaterQuality(lat, lng)
    : await fetchEEAWaterQuality(lat, lng);

  // Cache result (fire-and-forget)
  if (result) {
    try {
      await supabase.from('water_quality').insert({
        lat, lng,
        classification: result.classification,
        ecoli: result.ecoli,
        enterococci: result.enterococci,
        source: result.source,
        year: result.year,
      });
    } catch {
      // Cache write failure is non-critical
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Blue Flag lookup
// ---------------------------------------------------------------------------

export async function checkBlueFlag(osmId: string, lat: number, lng: number): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('blue_flags')
      .select('id')
      .gte('lat', lat - 0.01)
      .lte('lat', lat + 0.01)
      .gte('lng', lng - 0.01)
      .lte('lng', lng + 0.01)
      .limit(1)
      .single();

    return data !== null;
  } catch {
    return false;
  }
}
