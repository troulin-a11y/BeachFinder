import { API } from '../constants';
import { supabase } from '../lib/supabase';
import type { PhotoData } from '../types';

const FLICKR_KEY = process.env.EXPO_PUBLIC_FLICKR_API_KEY;
const UNSPLASH_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

interface WikimediaGeoResult {
  pageid: number;
  title: string;
  lat: number;
  lon: number;
  dist: number;
}

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

export async function fetchBeachPhoto(
  osmId: string,
  lat: number,
  lng: number,
  beachName: string,
): Promise<PhotoData> {
  // 1. Check Supabase cache
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

  // 2. Cascade: Wikimedia -> Flickr -> Unsplash -> Fallback
  const photo =
    (await tryWikimedia(lat, lng)) ??
    (await tryFlickr(lat, lng, beachName)) ??
    (await tryUnsplash(beachName)) ??
    buildFallbackPhoto();

  // 3. Cache result in Supabase
  if (photo.url) {
    await supabase.from('photos_cache').insert({
      osm_id: osmId,
      url: photo.url,
      source: photo.source,
      attribution: photo.attribution,
    });
  }

  return photo;
}
