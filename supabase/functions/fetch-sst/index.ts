// Supabase Edge Function: Fetches SST from Copernicus CMEMS via OPeNDAP
// Triggered by pg_cron every 6 hours
// Covers active zones where users searched in the last 24h

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Copernicus CMEMS OSTIA SST via OPeNDAP
const CMEMS_BASE = 'https://nrt.cmems-du.eu/thredds/dodsC/SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001.ascii';

interface ActiveZone {
  lat: number;
  lng: number;
}

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // 1. Find active zones (distinct lat/lng rounded to 0.25° grid)
    const { data: recentSearches } = await supabase
      .from('beaches_cache')
      .select('lat, lng')
      .gte('fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!recentSearches || recentSearches.length === 0) {
      return new Response(JSON.stringify({ message: 'No active zones' }), { status: 200 });
    }

    // Deduplicate to 0.25° grid cells
    const zones = new Map<string, ActiveZone>();
    for (const row of recentSearches) {
      const lat = Math.round(parseFloat(row.lat) * 4) / 4;
      const lng = Math.round(parseFloat(row.lng) * 4) / 4;
      const key = `${lat},${lng}`;
      if (!zones.has(key)) zones.set(key, { lat, lng });
    }

    let updated = 0;

    // 2. Fetch SST for each zone from Copernicus OPeNDAP
    for (const zone of zones.values()) {
      try {
        // OPeNDAP subset query for analysed_sst at this point
        const url = `${CMEMS_BASE}?analysed_sst[0:0][${latToIndex(zone.lat)}][${lonToIndex(zone.lng)}]`;
        const res = await fetch(url);
        if (!res.ok) continue;

        const text = await res.text();
        // Parse ASCII response: value is in Kelvin, convert to Celsius
        const match = text.match(/analysed_sst\[.*?\]\s*\n([\d.]+)/);
        if (!match) continue;

        const kelvin = parseFloat(match[1]);
        const celsius = kelvin - 273.15;

        if (celsius < -5 || celsius > 45) continue; // sanity check

        // 3. Upsert into sst_cache
        await supabase.from('sst_cache').upsert({
          lat: zone.lat,
          lng: zone.lng,
          temperature: Math.round(celsius * 10) / 10,
          source: 'copernicus',
          fetched_at: new Date().toISOString(),
        }, { onConflict: 'lat,lng' });

        updated++;
      } catch {
        continue; // Skip failed zones
      }
    }

    return new Response(
      JSON.stringify({ message: `Updated ${updated} SST points for ${zones.size} zones` }),
      { status: 200 },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

// OSTIA grid: 0.05° resolution, lat -89.975 to 89.975, lon -179.975 to 179.975
function latToIndex(lat: number): number {
  return Math.round((lat + 89.975) / 0.05);
}

function lonToIndex(lon: number): number {
  return Math.round((lon + 179.975) / 0.05);
}
