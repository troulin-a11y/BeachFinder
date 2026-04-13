import { useState, useEffect, useRef } from 'react';

export interface SearchSuggestion {
  displayName: string;
  city: string;
  latitude: number;
  longitude: number;
  type: 'city' | 'beach' | 'water';
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Search for cities, beaches, and water features in France
        const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=fr&accept-language=fr`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'BeachFinder/1.0' },
        });
        if (!res.ok) { setSuggestions([]); return; }

        const data = await res.json();

        const results: SearchSuggestion[] = data
          .filter((item: any) => item.lat && item.lon)
          .map((item: any) => {
            const addr = item.address ?? {};
            const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? '';
            const isWater = item.type === 'water' || item.class === 'natural' || item.class === 'waterway';
            const isBeach = item.type === 'beach' || (item.display_name ?? '').toLowerCase().includes('plage');

            // Build a clean display name
            let displayName = item.display_name?.split(',').slice(0, 2).join(',').trim() ?? query;

            return {
              displayName,
              city,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              type: isBeach ? 'beach' as const : isWater ? 'water' as const : 'city' as const,
            };
          });

        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350); // 350ms debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { suggestions, loading };
}
