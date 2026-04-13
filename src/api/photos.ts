import { API } from '../constants';
import { supabase } from '../lib/supabase';
import { findBeachPhoto } from '../data/beachPhotos';
import type { PhotoData } from '../types';

// Track beach index for generic photo rotation
let beachPhotoIndex = 0;

const FLICKR_KEY = process.env.EXPO_PUBLIC_FLICKR_API_KEY;
const UNSPLASH_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
const PEXELS_KEY = process.env.EXPO_PUBLIC_PEXELS_API_KEY;
const PIXABAY_KEY = process.env.EXPO_PUBLIC_PIXABAY_API_KEY;
const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WikimediaGeoResult {
  pageid: number;
  title: string;
  lat: number;
  lon: number;
  dist: number;
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

export function parseWikimediaPhotos(response: any): WikimediaGeoResult[] {
  return response?.query?.geosearch ?? [];
}

export function parseFlickrPhotos(response: any): Array<{ url: string; attribution: string }> {
  const photos = response?.photos?.photo ?? [];
  return photos.map((p: any) => ({
    url: `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_b.jpg`,
    attribution: `Flickr / ${p.owner}`,
  }));
}

export function buildFallbackPhoto(): PhotoData {
  return {
    url: '',  // will use require('assets/images/beach-fallback.jpg')
    source: 'fallback',
    attribution: null,
    isFallback: true,
  };
}

// ---------------------------------------------------------------------------
// Photo source cascade helpers
// ---------------------------------------------------------------------------

async function tryGooglePlaces(lat: number, lng: number, beachName: string): Promise<PhotoData | null> {
  if (!GOOGLE_PLACES_KEY) return null;
  try {
    // Step 1: Find the place via Nearby Search
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&keyword=${encodeURIComponent(beachName)}&key=${GOOGLE_PLACES_KEY}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();

    // Find first result with photos
    const place = searchData?.results?.find((r: any) => r.photos && r.photos.length > 0);
    if (!place) return null;

    const photoRef = place.photos[0].photo_reference;

    // Step 2: Build photo URL (this URL redirects to the actual image)
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_PLACES_KEY}`;

    return {
      url: photoUrl,
      source: 'wikimedia' as PhotoData['source'], // reuse existing type
      attribution: place.photos[0].html_attributions?.[0] ?? 'Google Maps',
      isFallback: false,
    };
  } catch {
    return null;
  }
}

async function tryWikimedia(lat: number, lng: number): Promise<PhotoData | null> {
  try {
    const url = `${API.WIKIMEDIA_API_URL}?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=1000&gsnamespace=6&gslimit=5&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const results = parseWikimediaPhotos(data);

    // Filter for image files
    const imageResult = results.find((r) =>
      /\.(jpg|jpeg|png|webp)$/i.test(r.title),
    );
    if (!imageResult) return null;

    // Get actual image URL
    const infoUrl = `${API.WIKIMEDIA_API_URL}?action=query&titles=${encodeURIComponent(imageResult.title)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;
    const infoRes = await fetch(infoUrl);
    if (!infoRes.ok) return null;
    const infoData = await infoRes.json();
    const pages = infoData?.query?.pages;
    const page = Object.values(pages ?? {})[0] as any;
    const imageUrl = page?.imageinfo?.[0]?.url;

    if (!imageUrl) return null;

    return {
      url: imageUrl,
      source: 'wikimedia',
      attribution: `Wikimedia Commons`,
      isFallback: false,
    };
  } catch {
    return null;
  }
}

async function tryFlickr(lat: number, lng: number, beachName: string): Promise<PhotoData | null> {
  if (!FLICKR_KEY) return null;
  try {
    const url = `${API.FLICKR_API_URL}?method=flickr.photos.search&api_key=${FLICKR_KEY}&lat=${lat}&lon=${lng}&radius=1&text=${encodeURIComponent(beachName + ' beach')}&sort=relevance&per_page=1&format=json&nojsoncallback=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const photos = parseFlickrPhotos(data);

    if (photos.length === 0) return null;
    return {
      url: photos[0].url,
      source: 'flickr',
      attribution: photos[0].attribution,
      isFallback: false,
    };
  } catch {
    return null;
  }
}

async function tryUnsplash(beachName: string): Promise<PhotoData | null> {
  if (!UNSPLASH_KEY) return null;
  try {
    const query = beachName || 'sandy beach coastline';
    const url = `${API.UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data?.results?.[0];

    if (!photo) return null;
    return {
      url: photo.urls.regular,
      source: 'unsplash',
      attribution: `Unsplash / ${photo.user?.name ?? 'Unknown'}`,
      isFallback: false,
    };
  } catch {
    return null;
  }
}

async function tryPexels(beachName: string): Promise<PhotoData | null> {
  if (!PEXELS_KEY) return null;
  try {
    const query = beachName ? `${beachName} plage mer` : 'plage sable mer';
    const url = `${API.PEXELS_API_URL}/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data?.photos?.[0];

    if (!photo) return null;
    return {
      url: photo.src.large,
      source: 'pexels',
      attribution: `Pexels / ${photo.photographer ?? 'Unknown'}`,
      isFallback: false,
    };
  } catch {
    return null;
  }
}

async function tryPixabay(beachName: string): Promise<PhotoData | null> {
  if (!PIXABAY_KEY) return null;
  try {
    const query = beachName ? `${beachName} plage` : 'plage sable mer';
    const url = `${API.PIXABAY_API_URL}/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&category=travel&per_page=3&safesearch=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data?.hits?.[0];

    if (!hit) return null;
    return {
      url: hit.webformatURL,
      source: 'pixabay',
      attribution: `Pixabay / ${hit.user ?? 'Unknown'}`,
      isFallback: false,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main fetch (cache -> cascade -> fallback)
// ---------------------------------------------------------------------------

export async function fetchBeachPhoto(
  osmId: string,
  lat: number,
  lng: number,
  beachName: string,
): Promise<PhotoData> {
  // 1. Check Supabase cache
  try {
    const { data: cached } = await supabase
      .from('photos_cache')
      .select('url, source, attribution')
      .eq('osm_id', osmId)
      .single();

    if (cached) {
      return {
        url: cached.url,
        source: cached.source as PhotoData['source'],
        attribution: cached.attribution,
        isFallback: cached.source === 'fallback',
      };
    }
  } catch {
    // Supabase unavailable — continue to cascade
  }

  // 2. Try built-in curated photo database first (no API key needed)
  const curatedPhoto = findBeachPhoto(beachName, beachPhotoIndex++);
  if (curatedPhoto.url) {
    const photo: PhotoData = {
      url: curatedPhoto.url,
      source: 'unsplash' as PhotoData['source'],
      attribution: curatedPhoto.attribution,
      isFallback: false,
    };

    // Cache in Supabase (fire-and-forget)
    try {
      await supabase.from('photos_cache').insert({
        osm_id: osmId,
        url: photo.url,
        source: photo.source,
        attribution: photo.attribution,
      });
    } catch {
      // non-critical
    }

    return photo;
  }

  // 3. Cascade: Google Places -> Wikimedia -> Pexels -> Pixabay -> Flickr -> Unsplash -> Fallback
  const photo =
    (await tryGooglePlaces(lat, lng, beachName)) ??
    (await tryWikimedia(lat, lng)) ??
    (await tryPexels(beachName)) ??
    (await tryPixabay(beachName)) ??
    (await tryFlickr(lat, lng, beachName)) ??
    (await tryUnsplash(beachName)) ??
    buildFallbackPhoto();

  // 3. Cache result in Supabase (fire-and-forget)
  if (photo.url) {
    try {
      await supabase.from('photos_cache').insert({
        osm_id: osmId,
        url: photo.url,
        source: photo.source,
        attribution: photo.attribution,
      });
    } catch {
      // Cache write failure is non-critical
    }
  }

  return photo;
}
