# BeachFinder — Design Spec

**Date:** 2026-04-05
**Status:** Draft
**Platform:** iOS & Android (React Native / Expo)
**Coverage:** Europe + USA

---

## 1. Overview

BeachFinder is a mobile app that geolocates the user and shows the 20 nearest beaches with real-time weather, sea temperature, safety conditions, amenities, nearby restaurants, and photos. Monetized via rewarded video ads (AdMob) and a premium subscription (RevenueCat).

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo) |
| Backend / DB | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth |
| In-App Purchases | RevenueCat |
| Ads | Google AdMob (rewarded video) |
| Maps | react-native-maps (MapView) |
| Local Storage | AsyncStorage + SQLite (expo-sqlite) |
| i18n | react-i18next, auto-detect OS locale |

## 3. External APIs

All free, all commercial-use allowed.

### 3.1 Beach Locations — OpenStreetMap Overpass API

- **Usage:** Live query, NOT bulk pre-load. Query beaches within 50km of user.
- **Query:** `node["natural"="beach"](around:50000,lat,lng);way["natural"="beach"](around:50000,lat,lng);`
- **Tags extracted on the beach itself:**
  - `award=blue_flag` → Blue Flag status
  - `dog=yes/no/leashed` → Dogs allowed
  - `wheelchair=yes/no` → Accessibility
  - `supervised=yes` → Lifeguard
  - `name` → Beach name
  - `surface` (sand, pebble, rock)
- **Secondary query** for POIs within 300m of each beach:
  - `amenity=restaurant/cafe/fast_food` → Nearby food
  - `amenity=toilets` → Toilets
  - `amenity=shower` → Showers
  - `amenity=parking` → Parking
- **Rate limit:** 10K queries/day, no API key
- **Cache:** Local device, 24h per zone
- **Cost:** Free

### 3.2 Weather (Air, Wind, UV) — OpenWeatherMap

- **Endpoints:** Current Weather API (free, 60 calls/min) + One Call 3.0 (free 1000 calls/day, requires credit card registration)
- **Data:** air temp, feels_like, wind speed/direction, UV index, visibility, sunrise/sunset, weather condition, 7-day forecast
- **Rate limit:** Current Weather: 1M calls/month. One Call 3.0: 1000 calls/day free.
- **Strategy:** Use Current Weather for list view (cheap). Use One Call 3.0 for detail view + forecast (richer but limited).
- **Cache:** Supabase shared cache, 1h TTL
- **Cost:** Free (commercial OK, API key required, One Call 3.0 requires CC on file)

### 3.3 Sea Surface Temperature — Copernicus Marine (Europe) + NOAA CO-OPS (USA)

**Europe — Copernicus CMEMS:**
- **Data:** Global OSTIA SST, ~5.5km resolution
- **Access:** Python toolbox (copernicusmarine) or OPeNDAP
- **Strategy:** Supabase Edge Function (Deno/TypeScript) triggered by pg_cron every 6h. Fetches SST grid via OPeNDAP for zones where users have been active in the last 24h, stores nearest-point values into sst_cache. App queries Supabase for cached SST.
- **License:** CC-BY 4.0, commercial OK
- **Cache:** Supabase, 6h TTL
- **Cost:** Free (registration required)

**USA — NOAA CO-OPS:**
- **Data:** Real measured water temperature at ~210 coastal stations
- **Access:** REST API, JSON response, no key
- **Strategy:** Find nearest station to beach, fetch latest reading
- **License:** Public domain, commercial OK
- **Cache:** Supabase, 1h TTL
- **Cost:** Free

### 3.4 Beach Safety Flags

**Real flag data where available:**
- **USA:** NOAA Marine Beach Forecast (ArcGIS REST, no key) — rip current risk, surf height per beach zone
- **Spain/Catalonia:** Protecció Civil API (`platges.interior.gencat.cat/api/platges`) — actual flag status during season, ~250 beaches

**Computed score everywhere else:**
- Wind > 40 km/h OR waves > 1.5m → Red (dangerous)
- Wind 25-40 km/h OR waves 1-1.5m → Orange (caution)
- Otherwise → Green (safe)

Display: colored flag banner with explanation text (e.g., "Strong wind, high waves").

### 3.5 Water Quality — EEA (Europe) + EPA (USA)

**Europe — EEA DISCODATA:**
- **Data:** Bathing water quality for 38 countries, ~22K sites. E.coli, enterococci, classification (Excellent/Good/Sufficient/Poor)
- **Access:** REST, SQL-like queries, no key
- **Cache:** Supabase, annual (data updates yearly)
- **Cost:** Free

**USA — EPA BEACON:**
- **Data:** 6K+ beaches, advisories, closures
- **Access:** REST API, no key
- **Cache:** Supabase, annual
- **Cost:** Free

### 3.6 Blue Flag Certification

- **Sources:** OSM `award=blue_flag` tag + EU JRC dataset + national open data (Ireland, Catalonia)
- **Strategy:** Static dataset stored in Supabase, updated annually
- **Cost:** Free

### 3.7 Beach Photos — Cascade Strategy

Priority order, stop at first hit:

1. **Wikimedia Commons** — geo-tagged photos, free, good European coverage
2. **Flickr API** — 3600 req/hour free, good USA coverage, search by geo + "beach"
3. **Unsplash API** — 50 req/hour free, generic fallback by keyword ("sandy beach", "coastline")
4. **Built-in fallback** — Beautiful generic beach photo bundled in app, with small label: *"Photo non contractuelle"*

- **Cache:** Supabase, 30 days. Photo URL + source attribution stored per beach.
- **Display:** Real photos show source credit. Fallback shows "non contractuelle" label.

### 3.8 Nearby Restaurants — OSM Overpass

- **Query:** `amenity=restaurant/cafe/fast_food/ice_cream` within 300m of beach center
- **Data:** Name, type, distance
- **Action:** "Y aller" button opens native Maps app for directions
- **Cache:** Local device, 24h
- **Cost:** Free

## 4. Architecture

### 4.1 Data Flow

```
User opens app
  → Device geolocation (lat/lng)
  → Overpass: 20 nearest beaches in 50km radius (cache local 24h)
  → For each beach, in parallel:
      ├─ Check Supabase shared cache
      │   ├─ Hit (fresh) → return cached data
      │   └─ Miss (stale) → call external API → store in Supabase → return
      ├─ OpenWeatherMap → air, wind, UV, forecast
      ├─ Copernicus/NOAA → sea temperature
      ├─ Photo cascade → Wikimedia → Flickr → Unsplash → fallback
      └─ Overpass secondary → amenities + restaurants in 300m
```

### 4.2 Cache Strategy — 3 Levels

| Level | Storage | TTL | Content |
|-------|---------|-----|---------|
| L1 — App memory | React state / context | Session | Currently displayed data |
| L2 — Local device | AsyncStorage / SQLite | 24h–30d | Visited beaches, photos, favorites, amenities |
| L3 — Supabase shared | PostgreSQL | Variable | Weather (1h), SST (6h), photos (30d), water quality (1yr) |

L3 is critical: if 10 users search beaches near Nice in the same hour, only 1 OpenWeatherMap call is made.

### 4.3 Supabase Schema (key tables)

```
beaches_cache        — id, osm_id, name, lat, lng, tags_json, last_fetched
weather_cache        — id, lat, lng, data_json, fetched_at (TTL: 1h)
sst_cache            — id, lat, lng, temperature, source, fetched_at (TTL: 6h)
photos_cache         — id, osm_id, url, source, attribution, fetched_at (TTL: 30d)
water_quality        — id, osm_id, classification, details_json, year
blue_flags           — id, osm_id, year, source
users                — id, email, premium_status, language, created_at
favorites            — id, user_id, osm_id, created_at
ad_views             — id, user_id, date, count (track daily ad views)
```

## 5. Screens & Navigation

Bottom tab navigation with 4 tabs.

### 5.1 Home (Beaches tab)

- **Top:** Interactive MapView with pins for 20 nearest beaches. Pin color = safety status (green/orange/red).
- **Bottom:** Scrollable list of beach cards, sorted by distance.
- **Card (compact):**
  - Thumbnail photo (with badges overlay: Blue Flag, dog-friendly)
  - Beach name, city, distance
  - Colored safety flag indicator (mini)
  - Key metrics row: 🌊 sea temp (cyan, bold) · ☀️ air temp · 💨 wind
  - Amenity icons row: 🚿 🚻 🅿️ ♿ 🍽×N

### 5.2 Beach Detail (tap on card)

- **Hero:** Full-width photo with overlay: beach name, city, distance, favorite button
- **Badges:** Blue Flag, safety flag, dog-friendly (top-right corner)
- **3 big metrics:** Sea temp | Air temp | Wind (speed + direction)
- **Safety banner:** Colored flag with explanation ("Green — calm seas, light wind" or "Source: NOAA" when real data)
- **Secondary metrics grid:** Waves, UV, water quality grade, sunset time
- **Amenities section:** Tags for showers, toilets, parking, accessible, lifeguard, dogs
- **Restaurants nearby:** List with name, type, distance, "Y aller" button
- **Water quality detail:** Grade (A+/A/B/C), source, E.coli/enterococci values
- **Blue Flag section:** Banner with criteria explanation (if applicable)
- **7-day forecast:** Day + weather icon + sea temp + air temp + wind. Today free (after initial ad). Each additional day (J+1, J+2...) requires watching another ad or premium.

### 5.3 Search

- **Search bar:** By beach name or city. Triggers Overpass query by name.
- **Quick filter chips:** Blue Flag, sea temp > 20°C, wind < 15km/h, excellent water quality
- **Advanced filters (premium):** Custom thresholds, combine multiple criteria, sort by sea temp/wind/distance

### 5.4 Favorites & Settings

- **Favorites list:** Saved beaches with live sea temp display
- **Notifications (premium):** "Your favorite beach is at 25°C today"
- **Settings:** Language (FR/EN, auto-detect OS), units (metric/imperial), theme (light/dark/auto), manage subscription, clear cache

## 6. Monetization

### 6.1 Free Tier

- Open app → 15s rewarded video ad (AdMob)
- Today's data fully unlocked
- Want tomorrow's forecast → watch another 15s ad
- Each additional day = 1 ad
- Basic search + filters

### 6.2 Premium

- No ads ever
- 7-day forecast for all beaches
- Favorites with push notifications / alerts
- Advanced filters (custom temp thresholds, combined criteria)
- Home screen widget (top 3 nearest beaches with key metrics)
- Managed via RevenueCat: monthly subscription, annual subscription, or one-time lifetime purchase

### 6.3 Ad Flow

```
App opens
  → Has premium? → Skip ad, full access
  → No premium? → Show rewarded video (15s max)
    → Ad watched → Today unlocked
    → Taps J+1 forecast → "Watch ad or go Premium?" modal
      → Watch ad → J+1 unlocked
      → Premium → RevenueCat paywall
```

## 7. Internationalization

- **Languages:** French (default), English
- **Detection:** `expo-localization`, reads device locale
- **Library:** `react-i18next`
- **Translated:** All UI text, error messages, safety explanations, quality labels
- **NOT translated:** Beach names (kept as-is from OSM), restaurant names

## 8. Error Handling

| Scenario | Behavior |
|----------|----------|
| No GPS | Show manual city search, ask permission again |
| No internet | Show cached data (L2) with "offline" banner, disable forecast |
| Overpass down | Show cached beaches (L2), retry with backoff |
| Weather API error | Show "--" for affected metrics, retry silently |
| No SST data | Show "N/A" for sea temp |
| No photo found | Show bundled fallback with "non contractuelle" |
| No beaches in 50km | Expand radius to 100km, then show "No beaches found" |
| Ad fails to load | Grant access anyway (don't block the user) |

## 9. Performance Targets

| Metric | Target |
|--------|--------|
| First beach list visible | < 3s (with GPS already available) |
| Beach detail load | < 1s (data pre-fetched) |
| App cold start | < 2s |
| Offline capability | Full for cached beaches |
| API budget (100K DAU) | ~5K unique external calls/day (well within all free tiers) |

## 10. Future Considerations (not in v1)

- More countries (Asia, South America, Africa)
- User-contributed photos and reviews
- Real-time crowd indicator ("how busy is this beach")
- Surf conditions integration (Surfline-like)
- Beach comparison mode (side by side)
- Apple Watch / Wear OS widget
- Social sharing ("I'm at this beach")
