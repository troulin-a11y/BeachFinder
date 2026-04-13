import { API, MAX_BEACHES, AMENITY_RADIUS_M } from '../constants';
import { haversineDistance } from '../utils/distance';
import type { Beach, BeachTags, Amenities, Restaurant, Coordinates } from '../types';

// ---------------------------------------------------------------------------
// Query builders
// ---------------------------------------------------------------------------

// Nearby search: beaches + lakes + swimming areas (smaller radius OK)
export function buildBeachQuery(lat: number, lng: number, radius: number): string {
  // For large radius (>100km), only search ocean/river beaches to avoid timeout
  const timeout = radius > 100000 ? 45 : 30;
  const limit = radius > 100000 ? 30 : 30;

  if (radius > 100000) {
    return `
[out:json][timeout:${timeout}];
(
  node["natural"="beach"](around:${radius},${lat},${lng});
  way["natural"="beach"](around:${radius},${lat},${lng});
);
out body center ${limit};
`.trim();
  }

  // For nearby search, include swimming areas and bathing places
  return `
[out:json][timeout:${timeout}];
(
  node["natural"="beach"](around:${radius},${lat},${lng});
  way["natural"="beach"](around:${radius},${lat},${lng});
  node["leisure"="swimming_area"](around:${radius},${lat},${lng});
  way["leisure"="swimming_area"](around:${radius},${lat},${lng});
  node["leisure"="bathing_place"](around:${radius},${lat},${lng});
  way["leisure"="bathing_place"](around:${radius},${lat},${lng});
  node["leisure"="water_park"](around:${radius},${lat},${lng});
);
out body center ${limit};
`.trim();
}

export function buildAmenityQuery(lat: number, lng: number): string {
  const r = AMENITY_RADIUS_M;
  return `
[out:json][timeout:25];
(
  node["amenity"="shower"](around:${r},${lat},${lng});
  node["amenity"="toilets"](around:${r},${lat},${lng});
  node["amenity"="parking"](around:${r},${lat},${lng});
  way["amenity"="parking"](around:${r},${lat},${lng});
  node["amenity"="lifeguard_base"](around:${r},${lat},${lng});
  node["emergency"="lifeguard"](around:${r},${lat},${lng});
  node["wheelchair"="yes"](around:${r},${lat},${lng});
  node["amenity"="restaurant"](around:${r},${lat},${lng});
  node["amenity"="cafe"](around:${r},${lat},${lng});
  node["amenity"="fast_food"](around:${r},${lat},${lng});
  node["amenity"="ice_cream"](around:${r},${lat},${lng});
);
out body;
`.trim();
}

// ---------------------------------------------------------------------------
// Overpass response types (internal)
// ---------------------------------------------------------------------------

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

export function parseOverpassBeaches(
  response: OverpassResponse,
  userLat: number,
  userLng: number,
): Beach[] {
  const beaches: Beach[] = [];
  const seen = new Set<string>();

  for (const el of response.elements) {
    // Deduplicate (same element can match both natural=beach and leisure=beach)
    const uid = `${el.type}/${el.id}`;
    if (seen.has(uid)) continue;
    seen.add(uid);
    // Resolve coordinates — nodes have lat/lon directly; ways/relations use center
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;

    if (lat === undefined || lng === undefined) continue;

    const tags = el.tags ?? {};
    const rawName = tags['name'] ?? tags['name:fr'] ?? tags['name:en'] ?? null;
    const city = tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:municipality'] ?? tags['is_in'] ?? null;
    const waterName = tags['water:name'] ?? tags['lake:name'] ?? null;
    const isSwimmingArea = tags['leisure'] === 'swimming_area' || tags['leisure'] === 'bathing_place';
    const isLake = tags['water'] === 'lake' || tags['water'] === 'reservoir';
    const isWaterPark = tags['leisure'] === 'water_park';
    const name = rawName
      ?? (waterName ? (isSwimmingArea ? `Baignade ${waterName}` : waterName) : null)
      ?? (city && isLake ? `Lac de ${city}` : null)
      ?? (city && isSwimmingArea ? `Baignade de ${city}` : null)
      ?? (city && isWaterPark ? `Parc aquatique de ${city}` : null)
      ?? (city ? `Plage de ${city}` : null)
      ?? (isLake ? `Plan d'eau #${beaches.length + 1}` : null)
      ?? (isSwimmingArea ? `Zone de baignade #${beaches.length + 1}` : null)
      ?? `Plage #${beaches.length + 1}`;

    const blueFlag =
      tags['award'] === 'blue_flag' ||
      tags['blue_flag'] === 'yes' ||
      tags['blue_flag:status'] === 'yes';

    const rawDog = tags['dog'];
    let dog: BeachTags['dog'] = null;
    if (rawDog === 'yes') dog = 'yes';
    else if (rawDog === 'no') dog = 'no';
    else if (rawDog === 'leashed') dog = 'leashed';

    const wheelchair =
      tags['wheelchair'] === 'yes' || tags['wheelchair'] === 'designated';

    const supervised =
      tags['supervised'] === 'yes' || tags['lifeguard'] === 'yes';

    const rawSurface = tags['surface'] ?? tags['beach'];
    let surface: BeachTags['surface'] = null;
    if (rawSurface === 'sand') surface = 'sand';
    else if (rawSurface === 'pebbles' || rawSurface === 'pebble') surface = 'pebble';
    else if (rawSurface === 'rock' || rawSurface === 'rocks') surface = 'rock';

    const distance = haversineDistance(userLat, userLng, lat, lng);

    beaches.push({
      osmId: `${el.type}/${el.id}`,
      name,
      location: { latitude: lat, longitude: lng } satisfies Coordinates,
      city,
      distance,
      tags: { blueFlag, dog, wheelchair, supervised, surface },
    });
  }

  // Sort ascending by distance, then cap at MAX_BEACHES
  beaches.sort((a, b) => a.distance - b.distance);
  return beaches.slice(0, MAX_BEACHES);
}

export function parseAmenities(
  response: OverpassResponse,
  beachLat: number,
  beachLng: number,
): { amenities: Amenities; restaurants: Restaurant[] } {
  const amenities: Amenities = {
    showers: false,
    toilets: false,
    parking: false,
    accessible: false,
    lifeguard: false,
  };
  const restaurants: Restaurant[] = [];

  for (const el of response.elements) {
    const tags = el.tags ?? {};
    const amenity = tags['amenity'];
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;

    if (amenity === 'shower') amenities.showers = true;
    if (amenity === 'toilets') amenities.toilets = true;
    if (amenity === 'parking') amenities.parking = true;
    if (amenity === 'lifeguard_base' || tags['emergency'] === 'lifeguard') {
      amenities.lifeguard = true;
    }
    if (tags['wheelchair'] === 'yes' || tags['wheelchair'] === 'designated') {
      amenities.accessible = true;
    }

    // Restaurants / food
    const foodTypes = ['restaurant', 'cafe', 'fast_food', 'ice_cream'] as const;
    type FoodType = (typeof foodTypes)[number];
    if (amenity && (foodTypes as readonly string[]).includes(amenity)) {
      if (lat !== undefined && lng !== undefined) {
        restaurants.push({
          name: tags['name'] ?? amenity,
          type: amenity as FoodType,
          distance: haversineDistance(beachLat, beachLng, lat, lng),
          location: { latitude: lat, longitude: lng },
        });
      }
    }
  }

  restaurants.sort((a, b) => a.distance - b.distance);

  return { amenities, restaurants };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function postOverpass(query: string): Promise<OverpassResponse> {
  const response = await fetch(API.OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<OverpassResponse>;
}

export async function fetchNearbyBeaches(
  lat: number,
  lng: number,
  radius: number,
): Promise<Beach[]> {
  const query = buildBeachQuery(lat, lng, radius);
  const data = await postOverpass(query);
  return parseOverpassBeaches(data, lat, lng);
}

export async function fetchBeachAmenities(
  beachLat: number,
  beachLng: number,
): Promise<{ amenities: Amenities; restaurants: Restaurant[] }> {
  const query = buildAmenityQuery(beachLat, beachLng);
  const data = await postOverpass(query);
  return parseAmenities(data, beachLat, beachLng);
}
