# BeachFinder - Claude Project Context

## Project Overview
BeachFinder - React Native (Expo) mobile app for finding beaches, lakes, and swimming spots.
Target: Europe + USA, all beaches/lakes/swimming areas.

## Tech Stack
- **Expo SDK 54** + React 19.1.0 + React Native 0.81.5
- **Testing**: Expo Go on iPhone (user IP: 192.168.1.37, port 8081)
- **APIs**: Overpass (OSM), OpenWeatherMap 2.5 free, Pexels, Pixabay, Nominatim
- **Backend**: Supabase (photos_cache table, Storage for photos)
- **User location**: 45.526, 4.919 (Vienne, France - inland)

## API Keys (in .env)
- `EXPO_PUBLIC_PEXELS_API_KEY` - Pexels photo search
- `EXPO_PUBLIC_PIXABAY_API_KEY` - Pixabay photo search
- `EXPO_PUBLIC_OWM_API_KEY` - OpenWeatherMap
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` - Not yet configured
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase

## Key Architecture Decisions
- **Overpass radius**: 50km initial, 150km expanded (80km causes 504 timeout)
- **Overpass query**: `natural=beach` + `leisure=swimming_area` + `leisure=bathing_place` + `leisure=water_park` (no `water=lake` - causes timeout)
- **Cache version**: v5 (increment to invalidate old cached data)
- **Photo cascade**: Google Places (if key) -> Wikimedia -> Pexels -> Pixabay -> Flickr -> Unsplash -> Fallback
- **Weather**: Free OWM 2.5 forecast API, aggregated from 3-hourly to daily
- **Forecast monetization**: Today free, future days locked (premium or ad to unlock)
- **AdGate**: Disabled in _layout.tsx (was causing screen freeze)
- **Search**: Nominatim autocomplete, France-only, 350ms debounce

## File Structure
```
src/
  app/(tabs)/index.tsx    - Home page (search + beach list)
  app/(tabs)/search.tsx   - Map page ("Carte" tab)
  app/(tabs)/favorites.tsx - Premium paywall
  app/(tabs)/settings.tsx  - Theme picker
  app/beach/[id].tsx      - Beach detail page
  api/overpass.ts         - Overpass API (beach search)
  api/weather.ts          - OWM weather + forecast
  api/photos.ts           - Photo cascade (Google/Wiki/Pexels/Pixabay)
  api/seaTemp.ts          - Sea temperature
  hooks/useNearbyBeaches.ts - Main data hook
  hooks/useSearchSuggestions.ts - Nominatim autocomplete
  components/BeachCard.tsx - Beach card with photo
  components/ForecastRow.tsx - Forecast with premium locks
  constants.ts            - Radii, cache TTL, API URLs
scripts/
  beach_photo_scraper.py  - Playwright scraper (Google Maps photos)
  clean-photos.py         - Color-based photo filter
  run-scraper.bat         - Launch scraper in visible terminal
```

## Photo Scraper Status
Script: `scripts/beach_photo_scraper.py`
- Uses Playwright (headed) to visit Google Maps for each beach
- Overpass fetches all named beaches per region, cached in `scripts/beach_data/`
- Photos saved to `scripts/photos/`, CSV in `scripts/photos_supabase.csv`
- Color filter: rejects interior/urban photos, keeps nature/water/beach
- Tests up to 5 photos per beach, picks first that passes filter
- Resume support: `--resume` skips already-downloaded photos

### Scraping Progress (regions)
- [x] FR-NW (Bretagne/Normandie) - 1006 beaches, ~902 photos
- [ ] FR-NE (Hauts-de-France/Grand Est) - in progress
- [ ] FR-W (Pays de Loire/Nouvelle Aquitaine)
- [ ] FR-SW (Landes/Basque/Occitanie W)
- [ ] FR-SE (PACA/Corse)
- [ ] FR-C (Auvergne/Rhone-Alpes)
- [ ] FR-MED (Occitanie E/Herault)
- [ ] ES-N, ES-E, ES-S, ES-BAL, ES-CAN (Espagne)
- [ ] IT-N, IT-C, IT-S (Italie)
- [ ] PT, GR, HR, TR-W, TR-S, GB, DE, NL, BE, DK, SE, NO, PL, IE, ME, AL, BG, RO, CY, MT
- [ ] US-NE, US-SE, US-W, US-SW, US-GL, US-HI, US-FL

## Known Issues
- Terminal output black when launching via Desktop Commander (use .bat file instead)
- Overpass 504 on large country queries (split by region/bbox)
- Some scraped photos are not beaches (interiors, buildings) - color filter helps
- `conda run python` required (Pillow not in default Python path)

## Commands
```bash
# Launch Expo
start scripts/start-expo.bat

# Launch scraper (edit run-scraper.bat to change region)
start scripts/run-scraper.bat

# Clean bad photos
conda run python scripts/clean-photos.py --dry-run
conda run python scripts/clean-photos.py

# Resume scraper
conda run python scripts/beach_photo_scraper.py --country FR-NE --skip-overpass --resume
```
