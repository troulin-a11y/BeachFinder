# BeachFinder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-platform mobile app that geolocates the user and displays the 20 nearest beaches with real-time weather, sea temperature, safety, amenities, photos, and nearby restaurants.

**Architecture:** React Native (Expo SDK 55) with file-based routing (expo-router). Supabase (PostgreSQL + PostGIS) as shared cache backend. All external APIs are free with commercial use. Three-tier cache: app memory → SQLite local → Supabase shared. Monetized via AdMob rewarded video + RevenueCat premium subscription.

**Tech Stack:** Expo SDK 55, TypeScript, expo-router, react-native-maps, @supabase/supabase-js, expo-sqlite, expo-location, react-i18next, react-native-google-mobile-ads, react-native-purchases

**Spec:** `docs/superpowers/specs/2026-04-05-beachfinder-design.md`

---

## File Structure

```
BeachFinder/
├── app/                          # expo-router file-based routing
│   ├── _layout.tsx               # Root layout: providers, i18n init, ad gate
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab navigator
│   │   ├── index.tsx             # Home screen (map + beach list)
│   │   ├── search.tsx            # Search screen
│   │   ├── favorites.tsx         # Favorites screen
│   │   └── settings.tsx          # Settings screen
│   └── beach/
│       └── [id].tsx              # Beach detail screen (dynamic route)
├── src/
│   ├── types.ts                  # All TypeScript types
│   ├── constants.ts              # API URLs, cache TTLs, thresholds
│   ├── i18n/
│   │   ├── index.ts              # i18next init
│   │   ├── fr.json               # French translations
│   │   └── en.json               # English translations
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client init
│   │   └── cache.ts              # SQLite local cache layer
│   ├── api/
│   │   ├── overpass.ts           # OSM Overpass: beaches + amenities
│   │   ├── weather.ts            # OpenWeatherMap current + forecast
│   │   ├── seaTemp.ts            # NOAA CO-OPS + Copernicus (via Supabase)
│   │   ├── safety.ts             # Safety score compute + real flag fetch
│   │   ├── photos.ts             # Wikimedia → Flickr → Unsplash cascade
│   │   └── waterQuality.ts       # EEA + EPA water quality + Blue Flag
│   ├── hooks/
│   │   ├── useLocation.ts        # GPS permission + position
│   │   ├── useNearbyBeaches.ts   # Orchestrator: fetch beaches + enrich
│   │   ├── useBeachDetail.ts     # Full detail data for one beach
│   │   └── usePremium.ts         # RevenueCat premium status
│   ├── context/
│   │   ├── PremiumContext.tsx     # Premium state provider
│   │   └── AdContext.tsx          # Ad unlock state (which days unlocked)
│   ├── components/
│   │   ├── BeachCard.tsx          # Compact beach card for list
│   │   ├── BeachMap.tsx           # MapView with colored pins
│   │   ├── MetricsRow.tsx         # Sea temp, air temp, wind row
│   │   ├── SafetyBanner.tsx       # Colored flag banner
│   │   ├── AmenityTags.tsx        # Amenity icon tags
│   │   ├── RestaurantList.tsx     # Nearby restaurants
│   │   ├── ForecastRow.tsx        # 7-day forecast with lock
│   │   ├── PhotoWithFallback.tsx  # Photo with cascade + fallback
│   │   ├── WaterQualityBadge.tsx  # Quality grade badge
│   │   ├── AdGate.tsx             # Rewarded video ad modal
│   │   └── OfflineBanner.tsx      # "You are offline" banner
│   └── utils/
│       └── distance.ts            # Haversine distance calculation
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       └── fetch-sst/
│           └── index.ts           # Edge function: Copernicus SST cron
├── __tests__/
│   ├── utils/
│   │   └── distance.test.ts
│   ├── api/
│   │   ├── overpass.test.ts
│   │   ├── weather.test.ts
│   │   ├── seaTemp.test.ts
│   │   ├── safety.test.ts
│   │   ├── photos.test.ts
│   │   └── waterQuality.test.ts
│   ├── hooks/
│   │   └── useNearbyBeaches.test.ts
│   └── components/
│       ├── BeachCard.test.tsx
│       └── SafetyBanner.test.tsx
├── assets/
│   └── images/
│       └── beach-fallback.jpg     # Generic beach fallback photo
├── app.json
├── tsconfig.json
└── .env
```

---

## Task 1: Project Scaffolding + Dependencies

**Files:**
- Create: `app.json`, `tsconfig.json`, `.env`, `.env.example`, `.gitignore`

- [ ] **Step 1: Create Expo project**

```bash
cd C:/Users/troul/Documents/Claude
npx create-expo-app@latest BeachFinder --template default@sdk-55
cd BeachFinder
```

Expected: Project created with expo-router pre-configured in `app/` directory.

- [ ] **Step 2: Install core dependencies**

```bash
npx expo install react-native-maps expo-location expo-localization expo-sqlite @supabase/supabase-js
npm install react-i18next i18next
```

Expected: All packages added to `package.json`.

- [ ] **Step 3: Install monetization dependencies**

```bash
npm install react-native-google-mobile-ads react-native-purchases react-native-purchases-ui expo-build-properties
```

Expected: All packages added.

- [ ] **Step 4: Create .env and .env.example**

`.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_OWM_API_KEY=your_openweathermap_key
EXPO_PUBLIC_FLICKR_API_KEY=your_flickr_key
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_key
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-xxxxxxxx~xxxxxxxx
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-xxxxxxxx~xxxxxxxx
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxx
```

`.env.example` — same file with placeholder values and comments.

- [ ] **Step 5: Update app.json with plugins**

```json
{
  "expo": {
    "name": "BeachFinder",
    "slug": "beachfinder",
    "version": "1.0.0",
    "scheme": "beachfinder",
    "platforms": ["ios", "android"],
    "icon": "./assets/images/icon.png",
    "plugins": [
      "expo-router",
      "expo-localization",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "BeachFinder needs your location to find nearby beaches."
        }
      ],
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-xxxxxxxx~xxxxxxxx",
          "iosAppId": "ca-app-pub-xxxxxxxx~xxxxxxxx"
        }
      ],
      "react-native-purchases",
      "react-native-purchases-ui"
    ]
  }
}
```

- [ ] **Step 6: Add .env to .gitignore**

Append to `.gitignore`:
```
.env
.env.local
```

- [ ] **Step 7: Verify project runs**

```bash
npx expo start
```

Expected: Metro bundler starts, app loads in Expo Go with default template screen.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Expo project with all dependencies"
```

---

## Task 2: Types, Constants & i18n

**Files:**
- Create: `src/types.ts`, `src/constants.ts`, `src/i18n/index.ts`, `src/i18n/fr.json`, `src/i18n/en.json`

- [ ] **Step 1: Create TypeScript types**

`src/types.ts`:
```ts
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BeachTags {
  blueFlag: boolean;
  dog: 'yes' | 'no' | 'leashed' | null;
  wheelchair: boolean;
  supervised: boolean;
  surface: 'sand' | 'pebble' | 'rock' | null;
}

export interface Beach {
  osmId: string;
  name: string;
  location: Coordinates;
  city: string | null;
  distance: number; // km from user
  tags: BeachTags;
}

export interface WeatherData {
  airTemp: number;        // °C
  feelsLike: number;      // °C
  windSpeed: number;      // km/h
  windDeg: number;        // degrees
  windDirection: string;  // "N", "NE", etc.
  uvIndex: number;
  visibility: number;     // km
  weatherIcon: string;    // OWM icon code
  weatherDesc: string;    // "clear sky", etc.
  sunrise: number;        // unix timestamp
  sunset: number;         // unix timestamp
}

export interface ForecastDay {
  date: string;           // YYYY-MM-DD
  airTemp: number;
  seaTemp: number | null;
  windSpeed: number;
  weatherIcon: string;
  weatherDesc: string;
}

export interface SeaTempData {
  temperature: number;    // °C
  source: 'noaa' | 'copernicus';
  stationName?: string;   // NOAA station name
}

export type SafetyLevel = 'green' | 'orange' | 'red';

export interface SafetyData {
  level: SafetyLevel;
  label: string;          // translated label
  reason: string;         // translated explanation
  source: 'computed' | 'noaa' | 'catalonia';
}

export interface WaterQualityData {
  classification: 'excellent' | 'good' | 'sufficient' | 'poor' | null;
  ecoli: number | null;
  enterococci: number | null;
  source: 'eea' | 'epa';
  year: number;
}

export interface PhotoData {
  url: string;
  source: 'wikimedia' | 'flickr' | 'unsplash' | 'fallback';
  attribution: string | null;
  isFallback: boolean;
}

export interface Amenities {
  showers: boolean;
  toilets: boolean;
  parking: boolean;
  accessible: boolean;
  lifeguard: boolean;
}

export interface Restaurant {
  name: string;
  type: 'restaurant' | 'cafe' | 'fast_food' | 'ice_cream';
  distance: number; // meters
  location: Coordinates;
}

export interface EnrichedBeach extends Beach {
  weather: WeatherData | null;
  seaTemp: SeaTempData | null;
  safety: SafetyData | null;
  photo: PhotoData | null;
  waterQuality: WaterQualityData | null;
  amenities: Amenities;
  restaurants: Restaurant[];
  forecast: ForecastDay[] | null;
}
```

- [ ] **Step 2: Create constants**

`src/constants.ts`:
```ts
export const API = {
  OVERPASS_URL: 'https://overpass-api.de/api/interpreter',
  OWM_CURRENT_URL: 'https://api.openweathermap.org/data/2.5/weather',
  OWM_ONECALL_URL: 'https://api.openweathermap.org/data/3.0/onecall',
  NOAA_COOPS_URL: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter',
  NOAA_STATIONS_URL: 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json',
  NOAA_BEACH_FORECAST_URL: 'https://mapservices.weather.noaa.gov/marine/rest/services',
  EEA_DISCODATA_URL: 'https://discodata.eea.europa.eu/sql',
  EPA_BEACON_URL: 'https://watersgeo.epa.gov/beacon2',
  WIKIMEDIA_API_URL: 'https://commons.wikimedia.org/w/api.php',
  FLICKR_API_URL: 'https://api.flickr.com/services/rest/',
  UNSPLASH_API_URL: 'https://api.unsplash.com',
  CATALONIA_FLAGS_URL: 'https://platges.interior.gencat.cat/api',
} as const;

export const CACHE_TTL = {
  BEACHES: 24 * 60 * 60 * 1000,        // 24h
  WEATHER: 60 * 60 * 1000,              // 1h
  SEA_TEMP: 6 * 60 * 60 * 1000,         // 6h
  PHOTOS: 30 * 24 * 60 * 60 * 1000,     // 30 days
  WATER_QUALITY: 365 * 24 * 60 * 60 * 1000, // 1 year
  AMENITIES: 24 * 60 * 60 * 1000,       // 24h
} as const;

export const SEARCH_RADIUS_M = 50_000;   // 50km default
export const SEARCH_RADIUS_EXPANDED_M = 100_000; // 100km fallback
export const MAX_BEACHES = 20;
export const AMENITY_RADIUS_M = 300;

export const SAFETY_THRESHOLDS = {
  WIND_RED: 40,     // km/h
  WIND_ORANGE: 25,
  WAVES_RED: 1.5,   // meters
  WAVES_ORANGE: 1.0,
} as const;

export const WIND_DIRECTIONS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
] as const;
```

- [ ] **Step 3: Create i18n translations**

`src/i18n/fr.json`:
```json
{
  "app": {
    "name": "BeachFinder"
  },
  "home": {
    "title": "Plages proches",
    "noBeaches": "Aucune plage trouvée à proximité",
    "expandSearch": "Recherche élargie à 100km..."
  },
  "search": {
    "title": "Recherche",
    "placeholder": "Nom de plage ou ville...",
    "filters": {
      "blueFlag": "Drapeau Bleu",
      "seaTemp": "Mer > 20°C",
      "lowWind": "Vent < 15 km/h",
      "excellentWater": "Eau excellente"
    }
  },
  "favorites": {
    "title": "Favoris",
    "empty": "Aucun favori pour le moment"
  },
  "settings": {
    "title": "Réglages",
    "language": "Langue",
    "units": "Unités",
    "metric": "Métriques (°C, km/h)",
    "imperial": "Impériales (°F, mph)",
    "theme": "Thème",
    "themeAuto": "Automatique",
    "themeLight": "Clair",
    "themeDark": "Sombre",
    "notifications": "Notifications favoris",
    "manageSub": "Gérer l'abonnement Premium",
    "clearCache": "Vider le cache"
  },
  "detail": {
    "sea": "Mer",
    "air": "Air",
    "wind": "Vent",
    "waves": "Vagues",
    "uv": "UV",
    "waterQuality": "Qualité de l'eau",
    "sunset": "Coucher",
    "amenities": "Équipements & services",
    "restaurants": "Restauration à proximité",
    "directions": "Y aller",
    "forecast": "Prévisions 7 jours",
    "blueFlag": "Pavillon Bleu",
    "blueFlagDesc": "Critères : qualité eau, gestion environnementale, éducation, sécurité, accessibilité"
  },
  "safety": {
    "green": "Baignade surveillée",
    "greenReason": "Mer calme, vent faible",
    "orange": "Prudence",
    "orangeReason": "Vent modéré ou vagues significatives",
    "red": "Baignade dangereuse",
    "redReason": "Vent fort ou mer agitée",
    "sourceNoaa": "Source : NOAA",
    "sourceComputed": "Score calculé depuis météo/vagues"
  },
  "quality": {
    "excellent": "Excellente",
    "good": "Bonne",
    "sufficient": "Suffisante",
    "poor": "Insuffisante"
  },
  "amenity": {
    "showers": "Douches",
    "toilets": "Toilettes",
    "parking": "Parking",
    "accessible": "Accessible",
    "lifeguard": "Surveillée",
    "dog": "Chiens OK",
    "dogLeashed": "Chiens en laisse"
  },
  "photo": {
    "nonContractuelle": "Photo non contractuelle"
  },
  "premium": {
    "title": "BeachFinder Premium",
    "subtitle": "Profitez de toutes les fonctionnalités",
    "features": {
      "noAds": "Sans publicité",
      "forecast": "Prévisions 7 jours",
      "alerts": "Alertes favoris",
      "filters": "Filtres avancés",
      "widget": "Widget écran d'accueil"
    },
    "monthly": "Abonnement mensuel",
    "annual": "Abonnement annuel",
    "lifetime": "Achat à vie",
    "restore": "Restaurer mes achats"
  },
  "ads": {
    "watchToUnlock": "Regarder une pub pour débloquer",
    "orPremium": "ou passer Premium"
  },
  "errors": {
    "noGps": "Localisation indisponible. Recherchez une ville.",
    "offline": "Vous êtes hors ligne. Données en cache affichées.",
    "noData": "N/A"
  }
}
```

`src/i18n/en.json`:
```json
{
  "app": {
    "name": "BeachFinder"
  },
  "home": {
    "title": "Nearby Beaches",
    "noBeaches": "No beaches found nearby",
    "expandSearch": "Expanding search to 100km..."
  },
  "search": {
    "title": "Search",
    "placeholder": "Beach name or city...",
    "filters": {
      "blueFlag": "Blue Flag",
      "seaTemp": "Sea > 20°C",
      "lowWind": "Wind < 15 km/h",
      "excellentWater": "Excellent water"
    }
  },
  "favorites": {
    "title": "Favorites",
    "empty": "No favorites yet"
  },
  "settings": {
    "title": "Settings",
    "language": "Language",
    "units": "Units",
    "metric": "Metric (°C, km/h)",
    "imperial": "Imperial (°F, mph)",
    "theme": "Theme",
    "themeAuto": "Auto",
    "themeLight": "Light",
    "themeDark": "Dark",
    "notifications": "Favorite notifications",
    "manageSub": "Manage Premium subscription",
    "clearCache": "Clear cache"
  },
  "detail": {
    "sea": "Sea",
    "air": "Air",
    "wind": "Wind",
    "waves": "Waves",
    "uv": "UV",
    "waterQuality": "Water Quality",
    "sunset": "Sunset",
    "amenities": "Amenities & Services",
    "restaurants": "Nearby Restaurants",
    "directions": "Get directions",
    "forecast": "7-Day Forecast",
    "blueFlag": "Blue Flag",
    "blueFlagDesc": "Criteria: water quality, environmental management, education, safety, accessibility"
  },
  "safety": {
    "green": "Swimming safe",
    "greenReason": "Calm sea, light wind",
    "orange": "Caution",
    "orangeReason": "Moderate wind or significant waves",
    "red": "Swimming dangerous",
    "redReason": "Strong wind or rough sea",
    "sourceNoaa": "Source: NOAA",
    "sourceComputed": "Computed from weather/wave data"
  },
  "quality": {
    "excellent": "Excellent",
    "good": "Good",
    "sufficient": "Sufficient",
    "poor": "Poor"
  },
  "amenity": {
    "showers": "Showers",
    "toilets": "Toilets",
    "parking": "Parking",
    "accessible": "Accessible",
    "lifeguard": "Lifeguard",
    "dog": "Dogs OK",
    "dogLeashed": "Dogs on leash"
  },
  "photo": {
    "nonContractuelle": "Illustrative photo"
  },
  "premium": {
    "title": "BeachFinder Premium",
    "subtitle": "Unlock all features",
    "features": {
      "noAds": "No ads",
      "forecast": "7-day forecast",
      "alerts": "Favorite alerts",
      "filters": "Advanced filters",
      "widget": "Home screen widget"
    },
    "monthly": "Monthly subscription",
    "annual": "Annual subscription",
    "lifetime": "Lifetime purchase",
    "restore": "Restore purchases"
  },
  "ads": {
    "watchToUnlock": "Watch an ad to unlock",
    "orPremium": "or go Premium"
  },
  "errors": {
    "noGps": "Location unavailable. Search for a city.",
    "offline": "You are offline. Showing cached data.",
    "noData": "N/A"
  }
}
```

- [ ] **Step 4: Create i18n init**

`src/i18n/index.ts`:
```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import fr from './fr.json';
import en from './en.json';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'fr';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: deviceLanguage === 'fr' ? 'fr' : 'en',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export default i18n;
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/constants.ts src/i18n/
git commit -m "feat: add types, constants, and i18n (FR/EN)"
```

---

## Task 3: Supabase Client + Database Schema

**Files:**
- Create: `src/lib/supabase.ts`, `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create Supabase client**

`src/lib/supabase.ts`:
```ts
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 2: Create database migration**

`supabase/migrations/001_initial_schema.sql`:
```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Beaches cache (from Overpass)
CREATE TABLE beaches_cache (
  id BIGSERIAL PRIMARY KEY,
  osm_id TEXT UNIQUE NOT NULL,
  name TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  city TEXT,
  tags_json JSONB DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_beaches_location ON beaches_cache USING GIST(location);
CREATE INDEX idx_beaches_osm_id ON beaches_cache(osm_id);

-- Weather cache
CREATE TABLE weather_cache (
  id BIGSERIAL PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  data_json JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weather_coords ON weather_cache(lat, lng);
CREATE INDEX idx_weather_fetched ON weather_cache(fetched_at);

-- Sea surface temperature cache
CREATE TABLE sst_cache (
  id BIGSERIAL PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  temperature DOUBLE PRECISION NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('noaa', 'copernicus')),
  station_name TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_sst_coords ON sst_cache(lat, lng);
CREATE INDEX idx_sst_fetched ON sst_cache(fetched_at);

-- Photos cache
CREATE TABLE photos_cache (
  id BIGSERIAL PRIMARY KEY,
  osm_id TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('wikimedia', 'flickr', 'unsplash', 'fallback')),
  attribution TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_osm ON photos_cache(osm_id);

-- Water quality
CREATE TABLE water_quality (
  id BIGSERIAL PRIMARY KEY,
  osm_id TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  classification TEXT CHECK (classification IN ('excellent', 'good', 'sufficient', 'poor')),
  ecoli DOUBLE PRECISION,
  enterococci DOUBLE PRECISION,
  source TEXT NOT NULL CHECK (source IN ('eea', 'epa')),
  year INTEGER NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wq_coords ON water_quality(lat, lng);

-- Blue flag beaches
CREATE TABLE blue_flags (
  id BIGSERIAL PRIMARY KEY,
  osm_id TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  name TEXT,
  country TEXT,
  year INTEGER NOT NULL,
  source TEXT NOT NULL
);

CREATE INDEX idx_bf_coords ON blue_flags(lat, lng);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  premium_status BOOLEAN DEFAULT FALSE,
  language TEXT DEFAULT 'fr',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites
CREATE TABLE favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  osm_id TEXT NOT NULL,
  beach_name TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, osm_id)
);

-- Ad views tracking
CREATE TABLE ad_views (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 1,
  UNIQUE(user_id, view_date)
);

-- Helper function: find nearest cached weather
CREATE OR REPLACE FUNCTION find_nearest_weather(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_max_age_minutes INTEGER DEFAULT 60)
RETURNS TABLE(data_json JSONB, fetched_at TIMESTAMPTZ, dist_km DOUBLE PRECISION) AS $$
BEGIN
  RETURN QUERY
  SELECT w.data_json, w.fetched_at,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(w.lng, w.lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) / 1000.0 AS dist_km
  FROM weather_cache w
  WHERE w.fetched_at > NOW() - (p_max_age_minutes || ' minutes')::interval
  ORDER BY ST_SetSRID(ST_MakePoint(w.lng, w.lat), 4326)::geography <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Helper function: find nearest SST
CREATE OR REPLACE FUNCTION find_nearest_sst(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_max_age_hours INTEGER DEFAULT 6)
RETURNS TABLE(temperature DOUBLE PRECISION, source TEXT, station_name TEXT, fetched_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT s.temperature, s.source, s.station_name, s.fetched_at
  FROM sst_cache s
  WHERE s.fetched_at > NOW() - (p_max_age_hours || ' hours')::interval
  ORDER BY ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326)::geography <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ad views" ON ad_views
  FOR ALL USING (auth.uid() = user_id);
```

- [ ] **Step 3: Apply migration via Supabase dashboard or CLI**

If using Supabase CLI:
```bash
npx supabase db push
```

Or paste the SQL into Supabase Dashboard > SQL Editor and run.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts supabase/
git commit -m "feat: add Supabase client and initial database schema"
```

---

## Task 4: Local Cache Layer (SQLite)

**Files:**
- Create: `src/lib/cache.ts`
- Test: `__tests__/lib/cache.test.ts`

- [ ] **Step 1: Write cache tests**

`__tests__/lib/cache.test.ts`:
```ts
import { LocalCache } from '../../src/lib/cache';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
  }),
}));

describe('LocalCache', () => {
  let cache: LocalCache;

  beforeEach(async () => {
    cache = new LocalCache();
    await cache.init();
  });

  test('get returns null for missing key', async () => {
    const db = (cache as any).db;
    db.getFirstAsync.mockResolvedValue(null);
    const result = await cache.get('missing_key');
    expect(result).toBeNull();
  });

  test('get returns parsed value for valid key', async () => {
    const db = (cache as any).db;
    const data = { name: 'Plage de la Salis' };
    db.getFirstAsync.mockResolvedValue({
      value: JSON.stringify(data),
      expires_at: Date.now() + 60000,
    });
    const result = await cache.get('beach_123');
    expect(result).toEqual(data);
  });

  test('get returns null for expired key', async () => {
    const db = (cache as any).db;
    db.getFirstAsync.mockResolvedValue({
      value: JSON.stringify({ name: 'old' }),
      expires_at: Date.now() - 1000,
    });
    const result = await cache.get('expired_key');
    expect(result).toBeNull();
  });

  test('set stores value with TTL', async () => {
    const db = (cache as any).db;
    await cache.set('key', { foo: 'bar' }, 3600000);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE'),
      expect.any(String),
      expect.any(String),
      expect.any(Number),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/cache.test.ts
```

Expected: FAIL — `Cannot find module '../../src/lib/cache'`

- [ ] **Step 3: Implement local cache**

`src/lib/cache.ts`:
```ts
import * as SQLite from 'expo-sqlite';

export class LocalCache {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('beachfinder_cache.db');
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) return null;
    const row = await this.db.getFirstAsync<{ value: string; expires_at: number }>(
      'SELECT value, expires_at FROM cache WHERE key = ?',
      key,
    );
    if (!row) return null;
    if (row.expires_at < Date.now()) {
      await this.db.runAsync('DELETE FROM cache WHERE key = ?', key);
      return null;
    }
    return JSON.parse(row.value) as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync(
      'INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)',
      key,
      JSON.stringify(value),
      Date.now() + ttlMs,
    );
  }

  async delete(key: string): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM cache WHERE key = ?', key);
  }

  async clearAll(): Promise<void> {
    if (!this.db) return;
    await this.db.execAsync('DELETE FROM cache');
  }

  async clearExpired(): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM cache WHERE expires_at < ?', Date.now());
  }
}

export const localCache = new LocalCache();
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/cache.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cache.ts __tests__/lib/cache.test.ts
git commit -m "feat: add SQLite local cache layer with TTL"
```

---

## Task 5: Distance Utility + Location Hook

**Files:**
- Create: `src/utils/distance.ts`, `src/hooks/useLocation.ts`
- Test: `__tests__/utils/distance.test.ts`

- [ ] **Step 1: Write distance tests**

`__tests__/utils/distance.test.ts`:
```ts
import { haversineDistance, degToCompass } from '../../src/utils/distance';

describe('haversineDistance', () => {
  test('same point returns 0', () => {
    expect(haversineDistance(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0);
  });

  test('Paris to Marseille ~ 660km', () => {
    const dist = haversineDistance(48.8566, 2.3522, 43.2965, 5.3698);
    expect(dist).toBeGreaterThan(650);
    expect(dist).toBeLessThan(670);
  });

  test('NYC to LA ~ 3940km', () => {
    const dist = haversineDistance(40.7128, -74.006, 34.0522, -118.2437);
    expect(dist).toBeGreaterThan(3930);
    expect(dist).toBeLessThan(3960);
  });
});

describe('degToCompass', () => {
  test('0 degrees is N', () => {
    expect(degToCompass(0)).toBe('N');
  });

  test('90 degrees is E', () => {
    expect(degToCompass(90)).toBe('E');
  });

  test('225 degrees is SW', () => {
    expect(degToCompass(225)).toBe('SW');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/utils/distance.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement distance utility**

`src/utils/distance.ts`:
```ts
import { WIND_DIRECTIONS } from '../constants';

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function degToCompass(deg: number): string {
  const index = Math.round(deg / 22.5) % 16;
  return WIND_DIRECTIONS[index];
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/utils/distance.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Implement location hook**

`src/hooks/useLocation.ts`:
```ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from '../types';

interface UseLocationResult {
  location: Coordinates | null;
  error: string | null;
  loading: boolean;
  retry: () => void;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchLocation() {
      setLoading(true);
      setError(null);

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setError('permission_denied');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!cancelled) {
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch (e) {
        if (!cancelled) setError('location_error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLocation();
    return () => { cancelled = true; };
  }, [retryCount]);

  return {
    location,
    error,
    loading,
    retry: () => setRetryCount((c) => c + 1),
  };
}
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/distance.ts src/hooks/useLocation.ts __tests__/utils/distance.test.ts
git commit -m "feat: add haversine distance util and location hook"
```

---

## Task 6: Overpass API — Beaches + Amenities

**Files:**
- Create: `src/api/overpass.ts`
- Test: `__tests__/api/overpass.test.ts`

- [ ] **Step 1: Write Overpass tests**

`__tests__/api/overpass.test.ts`:
```ts
import { parseOverpassBeaches, buildBeachQuery, buildAmenityQuery, parseAmenities } from '../../src/api/overpass';

describe('buildBeachQuery', () => {
  test('builds valid Overpass QL for given coordinates', () => {
    const query = buildBeachQuery(43.7, 7.26, 50000);
    expect(query).toContain('[out:json]');
    expect(query).toContain('"natural"="beach"');
    expect(query).toContain('around:50000,43.7,7.26');
  });
});

describe('parseOverpassBeaches', () => {
  test('parses node elements correctly', () => {
    const response = {
      elements: [
        {
          type: 'node',
          id: 123456,
          lat: 43.58,
          lon: 7.12,
          tags: {
            name: 'Plage de la Salis',
            'addr:city': 'Antibes',
            'award': 'blue_flag',
            dog: 'leashed',
            wheelchair: 'yes',
            supervised: 'yes',
            surface: 'sand',
          },
        },
      ],
    };

    const beaches = parseOverpassBeaches(response, 43.7, 7.26);
    expect(beaches).toHaveLength(1);
    expect(beaches[0].name).toBe('Plage de la Salis');
    expect(beaches[0].osmId).toBe('node/123456');
    expect(beaches[0].tags.blueFlag).toBe(true);
    expect(beaches[0].tags.dog).toBe('leashed');
    expect(beaches[0].tags.wheelchair).toBe(true);
    expect(beaches[0].tags.supervised).toBe(true);
    expect(beaches[0].tags.surface).toBe('sand');
  });

  test('parses way elements with center', () => {
    const response = {
      elements: [
        {
          type: 'way',
          id: 789,
          center: { lat: 43.55, lon: 7.1 },
          tags: { name: 'Beach Way' },
        },
      ],
    };
    const beaches = parseOverpassBeaches(response, 43.7, 7.26);
    expect(beaches).toHaveLength(1);
    expect(beaches[0].location.latitude).toBe(43.55);
  });

  test('unnamed beaches get fallback name', () => {
    const response = {
      elements: [
        { type: 'node', id: 111, lat: 43.5, lon: 7.1, tags: {} },
      ],
    };
    const beaches = parseOverpassBeaches(response, 43.7, 7.26);
    expect(beaches[0].name).toMatch(/Plage|Beach/);
  });

  test('sorts by distance and limits to 20', () => {
    const elements = Array.from({ length: 30 }, (_, i) => ({
      type: 'node' as const,
      id: i,
      lat: 43.5 + i * 0.01,
      lon: 7.1,
      tags: { name: `Beach ${i}` },
    }));
    const beaches = parseOverpassBeaches({ elements }, 43.5, 7.1);
    expect(beaches.length).toBeLessThanOrEqual(20);
    expect(beaches[0].distance).toBeLessThanOrEqual(beaches[1].distance);
  });
});

describe('parseAmenities', () => {
  test('parses amenity elements correctly', () => {
    const response = {
      elements: [
        { type: 'node', id: 1, lat: 43.5, lon: 7.1, tags: { amenity: 'toilets' } },
        { type: 'node', id: 2, lat: 43.5, lon: 7.1, tags: { amenity: 'shower' } },
        { type: 'node', id: 3, lat: 43.5, lon: 7.1, tags: { amenity: 'parking' } },
        { type: 'node', id: 4, lat: 43.5, lon: 7.1, tags: { amenity: 'restaurant', name: 'Le Café' } },
      ],
    };
    const result = parseAmenities(response, 43.5, 7.1);
    expect(result.amenities.toilets).toBe(true);
    expect(result.amenities.showers).toBe(true);
    expect(result.amenities.parking).toBe(true);
    expect(result.restaurants).toHaveLength(1);
    expect(result.restaurants[0].name).toBe('Le Café');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/overpass.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement Overpass API**

`src/api/overpass.ts`:
```ts
import { API, MAX_BEACHES, AMENITY_RADIUS_M } from '../constants';
import { haversineDistance } from '../utils/distance';
import type { Beach, BeachTags, Amenities, Restaurant, Coordinates } from '../types';

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

export function buildBeachQuery(lat: number, lng: number, radius: number): string {
  return `[out:json][timeout:25];(node["natural"="beach"](around:${radius},${lat},${lng});way["natural"="beach"](around:${radius},${lat},${lng}););out center tags;`;
}

export function buildAmenityQuery(lat: number, lng: number): string {
  return `[out:json][timeout:10];(node["amenity"~"restaurant|cafe|fast_food|ice_cream|toilets|shower|parking"](around:${AMENITY_RADIUS_M},${lat},${lng}););out tags;`;
}

export function parseOverpassBeaches(
  response: OverpassResponse,
  userLat: number,
  userLng: number,
): Beach[] {
  const beaches: Beach[] = response.elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (lat === undefined || lng === undefined) return null;

      const tags = el.tags ?? {};
      const beachTags: BeachTags = {
        blueFlag: tags.award === 'blue_flag' || tags['flag:type'] === 'blue',
        dog: (['yes', 'no', 'leashed'].includes(tags.dog) ? tags.dog : null) as BeachTags['dog'],
        wheelchair: tags.wheelchair === 'yes',
        supervised: tags.supervised === 'yes' || tags['lifeguard'] === 'yes',
        surface: (['sand', 'pebble', 'rock'].includes(tags.surface) ? tags.surface : null) as BeachTags['surface'],
      };

      return {
        osmId: `${el.type}/${el.id}`,
        name: tags.name || tags['name:en'] || tags['name:fr'] || `Plage #${el.id}`,
        location: { latitude: lat, longitude: lng },
        city: tags['addr:city'] || tags['addr:municipality'] || null,
        distance: haversineDistance(userLat, userLng, lat, lng),
        tags: beachTags,
      } satisfies Beach;
    })
    .filter((b): b is Beach => b !== null);

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
  const foodTypes = ['restaurant', 'cafe', 'fast_food', 'ice_cream'];

  for (const el of response.elements) {
    const tags = el.tags ?? {};
    const amenity = tags.amenity;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;

    if (amenity === 'toilets') amenities.toilets = true;
    if (amenity === 'shower') amenities.showers = true;
    if (amenity === 'parking') amenities.parking = true;

    if (foodTypes.includes(amenity) && lat && lng) {
      restaurants.push({
        name: tags.name || amenity,
        type: amenity as Restaurant['type'],
        distance: Math.round(haversineDistance(beachLat, beachLng, lat, lng) * 1000),
        location: { latitude: lat, longitude: lng },
      });
    }
  }

  restaurants.sort((a, b) => a.distance - b.distance);

  return { amenities, restaurants };
}

export async function fetchNearbyBeaches(
  lat: number,
  lng: number,
  radius: number,
): Promise<Beach[]> {
  const query = buildBeachQuery(lat, lng, radius);
  const res = await fetch(API.OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
  const data: OverpassResponse = await res.json();
  return parseOverpassBeaches(data, lat, lng);
}

export async function fetchBeachAmenities(
  beachLat: number,
  beachLng: number,
): Promise<{ amenities: Amenities; restaurants: Restaurant[] }> {
  const query = buildAmenityQuery(beachLat, beachLng);
  const res = await fetch(API.OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error(`Overpass amenity error: ${res.status}`);
  const data: OverpassResponse = await res.json();
  return parseAmenities(data, beachLat, beachLng);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/api/overpass.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/overpass.ts __tests__/api/overpass.test.ts
git commit -m "feat: add Overpass API for beach discovery and amenities"
```

---

## Task 7: OpenWeatherMap API

**Files:**
- Create: `src/api/weather.ts`
- Test: `__tests__/api/weather.test.ts`

- [ ] **Step 1: Write weather parsing tests**

`__tests__/api/weather.test.ts`:
```ts
import { parseCurrentWeather, parseForecast } from '../../src/api/weather';

describe('parseCurrentWeather', () => {
  test('parses OWM current weather response', () => {
    const owmResponse = {
      main: { temp: 26.3, feels_like: 27.1 },
      wind: { speed: 3.5, deg: 315 },
      visibility: 10000,
      weather: [{ icon: '01d', description: 'clear sky' }],
      sys: { sunrise: 1700000000, sunset: 1700040000 },
    };

    const result = parseCurrentWeather(owmResponse);
    expect(result.airTemp).toBe(26);
    expect(result.windSpeed).toBe(13); // 3.5 m/s -> 12.6 km/h -> 13
    expect(result.windDirection).toBe('NW');
    expect(result.weatherDesc).toBe('clear sky');
    expect(result.visibility).toBe(10);
  });
});

describe('parseForecast', () => {
  test('parses OWM One Call daily forecast', () => {
    const dailyData = [
      {
        dt: 1700000000,
        temp: { day: 24.5 },
        wind_speed: 4.0,
        weather: [{ icon: '02d', description: 'few clouds' }],
        uvi: 7,
      },
      {
        dt: 1700086400,
        temp: { day: 22.0 },
        wind_speed: 6.0,
        weather: [{ icon: '10d', description: 'rain' }],
        uvi: 3,
      },
    ];

    const result = parseForecast(dailyData);
    expect(result).toHaveLength(2);
    expect(result[0].airTemp).toBe(25);
    expect(result[0].windSpeed).toBe(14); // 4 m/s -> 14.4 -> 14
    expect(result[1].weatherDesc).toBe('rain');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/weather.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement weather API**

`src/api/weather.ts`:
```ts
import { API } from '../constants';
import { degToCompass } from '../utils/distance';
import type { WeatherData, ForecastDay } from '../types';

const OWM_KEY = process.env.EXPO_PUBLIC_OWM_API_KEY!;

interface OWMCurrentResponse {
  main: { temp: number; feels_like: number };
  wind: { speed: number; deg: number };
  visibility: number;
  weather: Array<{ icon: string; description: string }>;
  sys: { sunrise: number; sunset: number };
}

interface OWMDailyItem {
  dt: number;
  temp: { day: number };
  wind_speed: number;
  weather: Array<{ icon: string; description: string }>;
  uvi: number;
}

function msToKmh(ms: number): number {
  return Math.round(ms * 3.6);
}

export function parseCurrentWeather(data: OWMCurrentResponse): WeatherData {
  return {
    airTemp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    windSpeed: msToKmh(data.wind.speed),
    windDeg: data.wind.deg,
    windDirection: degToCompass(data.wind.deg),
    uvIndex: 0, // only available in One Call
    visibility: Math.round(data.visibility / 1000),
    weatherIcon: data.weather[0]?.icon ?? '01d',
    weatherDesc: data.weather[0]?.description ?? '',
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
  };
}

export function parseForecast(daily: OWMDailyItem[]): ForecastDay[] {
  return daily.map((d) => ({
    date: new Date(d.dt * 1000).toISOString().split('T')[0],
    airTemp: Math.round(d.temp.day),
    seaTemp: null, // filled separately
    windSpeed: msToKmh(d.wind_speed),
    weatherIcon: d.weather[0]?.icon ?? '01d',
    weatherDesc: d.weather[0]?.description ?? '',
  }));
}

export async function fetchCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = `${API.OWM_CURRENT_URL}?lat=${lat}&lon=${lng}&units=metric&appid=${OWM_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OWM current error: ${res.status}`);
  const data: OWMCurrentResponse = await res.json();
  return parseCurrentWeather(data);
}

export async function fetchForecast(lat: number, lng: number): Promise<{ weather: WeatherData; forecast: ForecastDay[] }> {
  const url = `${API.OWM_ONECALL_URL}?lat=${lat}&lon=${lng}&units=metric&exclude=minutely,hourly,alerts&appid=${OWM_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OWM onecall error: ${res.status}`);
  const data = await res.json();

  const weather: WeatherData = {
    airTemp: Math.round(data.current.temp),
    feelsLike: Math.round(data.current.feels_like),
    windSpeed: msToKmh(data.current.wind_speed),
    windDeg: data.current.wind_deg,
    windDirection: degToCompass(data.current.wind_deg),
    uvIndex: Math.round(data.current.uvi),
    visibility: Math.round((data.current.visibility ?? 10000) / 1000),
    weatherIcon: data.current.weather[0]?.icon ?? '01d',
    weatherDesc: data.current.weather[0]?.description ?? '',
    sunrise: data.current.sunrise,
    sunset: data.current.sunset,
  };

  const forecast = parseForecast(data.daily?.slice(0, 7) ?? []);

  return { weather, forecast };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/api/weather.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/weather.ts __tests__/api/weather.test.ts
git commit -m "feat: add OpenWeatherMap API for weather and forecast"
```

---

## Task 8: Sea Temperature (NOAA + Copernicus via Supabase)

**Files:**
- Create: `src/api/seaTemp.ts`
- Test: `__tests__/api/seaTemp.test.ts`

- [ ] **Step 1: Write sea temp tests**

`__tests__/api/seaTemp.test.ts`:
```ts
import { parseNoaaWaterTemp, isUSCoast } from '../../src/api/seaTemp';

describe('isUSCoast', () => {
  test('New York is US coast', () => {
    expect(isUSCoast(40.7, -74.0)).toBe(true);
  });

  test('Nice, France is not US coast', () => {
    expect(isUSCoast(43.7, 7.26)).toBe(false);
  });

  test('Hawaii is US coast', () => {
    expect(isUSCoast(21.3, -157.8)).toBe(true);
  });
});

describe('parseNoaaWaterTemp', () => {
  test('parses NOAA CO-OPS response correctly', () => {
    const response = {
      data: [
        { t: '2026-04-05 12:00', v: '18.5', f: '0,0,0' },
        { t: '2026-04-05 12:06', v: '18.6', f: '0,0,0' },
      ],
    };

    const result = parseNoaaWaterTemp(response);
    expect(result).toBe(18.6); // latest reading
  });

  test('returns null for empty data', () => {
    expect(parseNoaaWaterTemp({ data: [] })).toBeNull();
    expect(parseNoaaWaterTemp({})).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/seaTemp.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement sea temp API**

`src/api/seaTemp.ts`:
```ts
import { API } from '../constants';
import { supabase } from '../lib/supabase';
import type { SeaTempData } from '../types';

export function isUSCoast(lat: number, lng: number): boolean {
  // Continental US + Alaska + Hawaii bounding boxes
  const continental = lat >= 24.5 && lat <= 49.5 && lng >= -125 && lng <= -66;
  const alaska = lat >= 51 && lat <= 72 && lng >= -180 && lng <= -129;
  const hawaii = lat >= 18.5 && lat <= 22.5 && lng >= -161 && lng <= -154;
  return continental || alaska || hawaii;
}

interface NoaaResponse {
  data?: Array<{ t: string; v: string; f: string }>;
}

export function parseNoaaWaterTemp(response: NoaaResponse): number | null {
  if (!response.data || response.data.length === 0) return null;
  const latest = response.data[response.data.length - 1];
  const temp = parseFloat(latest.v);
  return isNaN(temp) ? null : temp;
}

async function fetchNoaaStationTemp(stationId: string): Promise<number | null> {
  const now = new Date();
  const begin = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2h ago
  const fmt = (d: Date) => d.toISOString().replace(/[-:T]/g, '').slice(0, 8);

  const url = `${API.NOAA_COOPS_URL}?begin_date=${fmt(begin)}&end_date=${fmt(now)}&station=${stationId}&product=water_temperature&datum=&units=metric&time_zone=gmt&application=beachfinder&format=json`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data: NoaaResponse = await res.json();
  return parseNoaaWaterTemp(data);
}

async function findNearestNoaaStation(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`${API.NOAA_STATIONS_URL}?type=watertemp`);
    if (!res.ok) return null;
    const data = await res.json();
    const stations = data.stations ?? [];

    let nearest: { id: string; dist: number } | null = null;
    for (const s of stations) {
      const dist = Math.sqrt(
        Math.pow(s.lat - lat, 2) + Math.pow(s.lng - lng, 2),
      );
      if (!nearest || dist < nearest.dist) {
        nearest = { id: s.id, dist };
      }
    }
    return nearest?.id ?? null;
  } catch {
    return null;
  }
}

async function fetchFromSupabaseCache(lat: number, lng: number): Promise<SeaTempData | null> {
  const { data, error } = await supabase.rpc('find_nearest_sst', {
    p_lat: lat,
    p_lng: lng,
    p_max_age_hours: 6,
  });

  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return {
    temperature: Math.round(row.temperature * 10) / 10,
    source: row.source as 'noaa' | 'copernicus',
    stationName: row.station_name ?? undefined,
  };
}

async function cacheSST(lat: number, lng: number, temp: number, source: string, stationName?: string): Promise<void> {
  await supabase.from('sst_cache').insert({
    lat, lng, temperature: temp, source, station_name: stationName,
  });
}

export async function fetchSeaTemperature(lat: number, lng: number): Promise<SeaTempData | null> {
  // 1. Check Supabase shared cache first
  const cached = await fetchFromSupabaseCache(lat, lng);
  if (cached) return cached;

  // 2. For US coast: try NOAA real buoy data
  if (isUSCoast(lat, lng)) {
    const stationId = await findNearestNoaaStation(lat, lng);
    if (stationId) {
      const temp = await fetchNoaaStationTemp(stationId);
      if (temp !== null) {
        await cacheSST(lat, lng, temp, 'noaa', stationId);
        return { temperature: temp, source: 'noaa', stationName: stationId };
      }
    }
  }

  // 3. For Europe: rely on Copernicus data cached by edge function
  // If cache miss, return null (edge function hasn't cached this zone yet)
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/api/seaTemp.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/seaTemp.ts __tests__/api/seaTemp.test.ts
git commit -m "feat: add sea temperature API (NOAA + Supabase cache)"
```

---

## Task 9: Safety Score Calculation

**Files:**
- Create: `src/api/safety.ts`
- Test: `__tests__/api/safety.test.ts`

- [ ] **Step 1: Write safety tests**

`__tests__/api/safety.test.ts`:
```ts
import { computeSafetyScore } from '../../src/api/safety';

describe('computeSafetyScore', () => {
  test('calm conditions return green', () => {
    const result = computeSafetyScore(10, 0.3);
    expect(result.level).toBe('green');
  });

  test('moderate wind returns orange', () => {
    const result = computeSafetyScore(30, 0.5);
    expect(result.level).toBe('orange');
  });

  test('strong wind returns red', () => {
    const result = computeSafetyScore(45, 0.5);
    expect(result.level).toBe('red');
  });

  test('high waves return red regardless of wind', () => {
    const result = computeSafetyScore(5, 2.0);
    expect(result.level).toBe('red');
  });

  test('moderate waves return orange', () => {
    const result = computeSafetyScore(10, 1.2);
    expect(result.level).toBe('orange');
  });

  test('source is always computed', () => {
    const result = computeSafetyScore(10, 0.3);
    expect(result.source).toBe('computed');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/safety.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement safety score**

`src/api/safety.ts`:
```ts
import { SAFETY_THRESHOLDS } from '../constants';
import type { SafetyData, SafetyLevel } from '../types';

export function computeSafetyScore(
  windSpeedKmh: number,
  waveHeightM: number = 0,
): SafetyData {
  let level: SafetyLevel = 'green';
  let labelKey = 'safety.green';
  let reasonKey = 'safety.greenReason';

  if (windSpeedKmh > SAFETY_THRESHOLDS.WIND_RED || waveHeightM > SAFETY_THRESHOLDS.WAVES_RED) {
    level = 'red';
    labelKey = 'safety.red';
    reasonKey = 'safety.redReason';
  } else if (windSpeedKmh > SAFETY_THRESHOLDS.WIND_ORANGE || waveHeightM > SAFETY_THRESHOLDS.WAVES_ORANGE) {
    level = 'orange';
    labelKey = 'safety.orange';
    reasonKey = 'safety.orangeReason';
  }

  return {
    level,
    label: labelKey,
    reason: reasonKey,
    source: 'computed',
  };
}

export async function fetchNOAABeachSafety(lat: number, lng: number): Promise<SafetyData | null> {
  // NOAA Marine Beach Forecast (ArcGIS REST)
  try {
    const url = `https://mapservices.weather.noaa.gov/marine/rest/services/NDBCObs/MapServer/0/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=50000&units=esriSRUnit_Meter&outFields=*&f=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data.features || data.features.length === 0) return null;
    const attrs = data.features[0].attributes;

    const windSpeed = (attrs.WIND_SPEED_KTS ?? 0) * 1.852; // knots to km/h
    const waveHeight = attrs.WAVE_HEIGHT_M ?? 0;

    const computed = computeSafetyScore(windSpeed, waveHeight);
    return { ...computed, source: 'noaa' };
  } catch {
    return null;
  }
}

export async function fetchSafety(
  lat: number,
  lng: number,
  windSpeedKmh: number,
  isUS: boolean,
): Promise<SafetyData> {
  // Try real data for US beaches
  if (isUS) {
    const noaaData = await fetchNOAABeachSafety(lat, lng);
    if (noaaData) return noaaData;
  }

  // Fallback: compute from weather data
  return computeSafetyScore(windSpeedKmh);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/api/safety.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/safety.ts __tests__/api/safety.test.ts
git commit -m "feat: add safety score computation and NOAA fetch"
```

---

## Task 10: Photo Cascade

**Files:**
- Create: `src/api/photos.ts`
- Test: `__tests__/api/photos.test.ts`

- [ ] **Step 1: Write photo cascade tests**

`__tests__/api/photos.test.ts`:
```ts
import { parseWikimediaPhotos, parseFlickrPhotos, buildFallbackPhoto } from '../../src/api/photos';

describe('parseWikimediaPhotos', () => {
  test('extracts image URL from geosearch response', () => {
    const response = {
      query: {
        geosearch: [
          { pageid: 123, title: 'File:Beach.jpg', lat: 43.5, lon: 7.1, dist: 100 },
        ],
      },
    };
    const result = parseWikimediaPhotos(response);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('File:Beach.jpg');
  });

  test('returns empty for no results', () => {
    expect(parseWikimediaPhotos({ query: { geosearch: [] } })).toHaveLength(0);
    expect(parseWikimediaPhotos({})).toHaveLength(0);
  });
});

describe('parseFlickrPhotos', () => {
  test('builds photo URL from Flickr response', () => {
    const response = {
      photos: {
        photo: [
          { id: '1', secret: 'abc', server: '65535', farm: 66, title: 'Beach sunset', owner: 'user1' },
        ],
      },
    };
    const result = parseFlickrPhotos(response);
    expect(result).toHaveLength(1);
    expect(result[0].url).toContain('staticflickr.com');
    expect(result[0].attribution).toContain('user1');
  });
});

describe('buildFallbackPhoto', () => {
  test('returns fallback with isFallback true', () => {
    const result = buildFallbackPhoto();
    expect(result.isFallback).toBe(true);
    expect(result.source).toBe('fallback');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/photos.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement photo cascade**

`src/api/photos.ts`:
```ts
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

  // 2. Cascade: Wikimedia → Flickr → Unsplash → Fallback
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/api/photos.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/photos.ts __tests__/api/photos.test.ts
git commit -m "feat: add photo cascade (Wikimedia -> Flickr -> Unsplash -> fallback)"
```

---

## Task 11: Water Quality + Blue Flag

**Files:**
- Create: `src/api/waterQuality.ts`
- Test: `__tests__/api/waterQuality.test.ts`

- [ ] **Step 1: Write water quality tests**

`__tests__/api/waterQuality.test.ts`:
```ts
import { parseEEAResponse, classificationToGrade } from '../../src/api/waterQuality';

describe('classificationToGrade', () => {
  test('maps EEA classifications correctly', () => {
    expect(classificationToGrade('Excellent')).toBe('excellent');
    expect(classificationToGrade('Good')).toBe('good');
    expect(classificationToGrade('Sufficient')).toBe('sufficient');
    expect(classificationToGrade('Poor')).toBe('poor');
    expect(classificationToGrade('Unknown')).toBeNull();
  });
});

describe('parseEEAResponse', () => {
  test('parses EEA DISCODATA response', () => {
    const response = {
      results: [
        {
          classification: 'Excellent',
          ecoli: 45,
          enterococci: 28,
          year: 2025,
        },
      ],
    };
    const result = parseEEAResponse(response);
    expect(result).not.toBeNull();
    expect(result!.classification).toBe('excellent');
    expect(result!.ecoli).toBe(45);
    expect(result!.source).toBe('eea');
  });

  test('returns null for empty response', () => {
    expect(parseEEAResponse({ results: [] })).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/waterQuality.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement water quality API**

`src/api/waterQuality.ts`:
```ts
import { API } from '../constants';
import { supabase } from '../lib/supabase';
import { isUSCoast } from './seaTemp';
import type { WaterQualityData } from '../types';

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

async function fetchEEAWaterQuality(lat: number, lng: number): Promise<WaterQualityData | null> {
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

export async function fetchWaterQuality(lat: number, lng: number): Promise<WaterQualityData | null> {
  // Check Supabase cache (annual data)
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

  // Fetch fresh data
  const result = isUSCoast(lat, lng)
    ? await fetchEPAWaterQuality(lat, lng)
    : await fetchEEAWaterQuality(lat, lng);

  // Cache result
  if (result) {
    await supabase.from('water_quality').insert({
      lat, lng,
      classification: result.classification,
      ecoli: result.ecoli,
      enterococci: result.enterococci,
      source: result.source,
      year: result.year,
    });
  }

  return result;
}

export async function checkBlueFlag(osmId: string, lat: number, lng: number): Promise<boolean> {
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
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/api/waterQuality.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/waterQuality.ts __tests__/api/waterQuality.test.ts
git commit -m "feat: add water quality (EEA + EPA) and Blue Flag check"
```

---

## Task 12: Beach Enrichment Orchestrator Hook

**Files:**
- Create: `src/hooks/useNearbyBeaches.ts`, `src/hooks/useBeachDetail.ts`

- [ ] **Step 1: Create the orchestrator hook**

`src/hooks/useNearbyBeaches.ts`:
```ts
import { useState, useEffect, useCallback } from 'react';
import type { Coordinates, Beach, EnrichedBeach, Amenities } from '../types';
import { localCache } from '../lib/cache';
import { CACHE_TTL, SEARCH_RADIUS_M, SEARCH_RADIUS_EXPANDED_M } from '../constants';
import { fetchNearbyBeaches, fetchBeachAmenities } from '../api/overpass';
import { fetchCurrentWeather } from '../api/weather';
import { fetchSeaTemperature } from '../api/seaTemp';
import { computeSafetyScore } from '../api/safety';
import { fetchBeachPhoto } from '../api/photos';
import { fetchWaterQuality, checkBlueFlag } from '../api/waterQuality';
import { isUSCoast } from '../api/seaTemp';

interface UseNearbyBeachesResult {
  beaches: EnrichedBeach[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const EMPTY_AMENITIES: Amenities = {
  showers: false, toilets: false, parking: false, accessible: false, lifeguard: false,
};

export function useNearbyBeaches(location: Coordinates | null): UseNearbyBeachesResult {
  const [beaches, setBeaches] = useState<EnrichedBeach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const { latitude: lat, longitude: lng } = location!;
        const cacheKey = `beaches_${lat.toFixed(2)}_${lng.toFixed(2)}`;

        // L2 cache check
        const cachedBeaches = await localCache.get<Beach[]>(cacheKey);
        let rawBeaches: Beach[];

        if (cachedBeaches && cachedBeaches.length > 0) {
          rawBeaches = cachedBeaches;
        } else {
          rawBeaches = await fetchNearbyBeaches(lat, lng, SEARCH_RADIUS_M);

          // Expand search if too few results
          if (rawBeaches.length === 0) {
            rawBeaches = await fetchNearbyBeaches(lat, lng, SEARCH_RADIUS_EXPANDED_M);
          }

          if (rawBeaches.length > 0) {
            await localCache.set(cacheKey, rawBeaches, CACHE_TTL.BEACHES);
          }
        }

        if (cancelled) return;

        if (rawBeaches.length === 0) {
          setBeaches([]);
          setError('no_beaches');
          return;
        }

        // Start with basic data, enrich progressively
        const initial: EnrichedBeach[] = rawBeaches.map((b) => ({
          ...b,
          weather: null,
          seaTemp: null,
          safety: null,
          photo: null,
          waterQuality: null,
          amenities: EMPTY_AMENITIES,
          restaurants: [],
          forecast: null,
        }));

        setBeaches(initial);

        // Enrich in parallel (weather + photo for each beach)
        const enriched = await Promise.all(
          initial.map(async (beach) => {
            const [weather, seaTemp, photo, amenityData] = await Promise.allSettled([
              fetchCurrentWeather(beach.location.latitude, beach.location.longitude),
              fetchSeaTemperature(beach.location.latitude, beach.location.longitude),
              fetchBeachPhoto(
                beach.osmId,
                beach.location.latitude,
                beach.location.longitude,
                beach.name,
              ),
              fetchBeachAmenities(beach.location.latitude, beach.location.longitude),
            ]);

            const weatherData = weather.status === 'fulfilled' ? weather.value : null;
            const seaTempData = seaTemp.status === 'fulfilled' ? seaTemp.value : null;
            const photoData = photo.status === 'fulfilled' ? photo.value : null;
            const amenities = amenityData.status === 'fulfilled' ? amenityData.value : { amenities: EMPTY_AMENITIES, restaurants: [] };

            // Merge blue flag from Supabase if not in OSM tags
            let blueFlag = beach.tags.blueFlag;
            if (!blueFlag) {
              blueFlag = await checkBlueFlag(beach.osmId, beach.location.latitude, beach.location.longitude);
            }

            const safety = weatherData
              ? computeSafetyScore(weatherData.windSpeed)
              : null;

            return {
              ...beach,
              tags: { ...beach.tags, blueFlag },
              weather: weatherData,
              seaTemp: seaTempData,
              safety,
              photo: photoData,
              waterQuality: null, // loaded on detail view
              amenities: {
                ...amenities.amenities,
                accessible: beach.tags.wheelchair,
                lifeguard: beach.tags.supervised,
              },
              restaurants: amenities.restaurants,
              forecast: null, // loaded on detail view
            } satisfies EnrichedBeach;
          }),
        );

        if (!cancelled) setBeaches(enriched);
      } catch (e) {
        if (!cancelled) setError('fetch_error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [location, refreshKey]);

  return { beaches, loading, error, refresh };
}
```

- [ ] **Step 2: Create beach detail hook**

`src/hooks/useBeachDetail.ts`:
```ts
import { useState, useEffect } from 'react';
import type { EnrichedBeach, ForecastDay, WaterQualityData } from '../types';
import { fetchForecast } from '../api/weather';
import { fetchWaterQuality } from '../api/waterQuality';

interface UseBeachDetailResult {
  forecast: ForecastDay[] | null;
  waterQuality: WaterQualityData | null;
  loading: boolean;
}

export function useBeachDetail(beach: EnrichedBeach | null): UseBeachDetailResult {
  const [forecast, setForecast] = useState<ForecastDay[] | null>(null);
  const [waterQuality, setWaterQuality] = useState<WaterQualityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!beach) return;
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      const { latitude: lat, longitude: lng } = beach!.location;

      const [forecastResult, wqResult] = await Promise.allSettled([
        fetchForecast(lat, lng),
        fetchWaterQuality(lat, lng),
      ]);

      if (cancelled) return;

      if (forecastResult.status === 'fulfilled') {
        // Merge sea temp into forecast days
        const days = forecastResult.value.forecast.map((d) => ({
          ...d,
          seaTemp: beach!.seaTemp?.temperature ?? null,
        }));
        setForecast(days);
      }

      if (wqResult.status === 'fulfilled') {
        setWaterQuality(wqResult.value);
      }

      setLoading(false);
    }

    loadDetail();
    return () => { cancelled = true; };
  }, [beach?.osmId]);

  return { forecast, waterQuality, loading };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useNearbyBeaches.ts src/hooks/useBeachDetail.ts
git commit -m "feat: add beach enrichment orchestrator and detail hooks"
```

---

## Task 13: Premium & Ad Contexts

**Files:**
- Create: `src/context/PremiumContext.tsx`, `src/context/AdContext.tsx`, `src/hooks/usePremium.ts`

- [ ] **Step 1: Create Premium context**

`src/context/PremiumContext.tsx`:
```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

interface PremiumState {
  isPremium: boolean;
  loading: boolean;
  restore: () => Promise<void>;
}

const PremiumContext = createContext<PremiumState>({
  isPremium: false,
  loading: true,
  restore: async () => {},
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        Purchases.configure({
          apiKey: Platform.select({
            ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!,
            android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!,
          })!,
        });

        const info: CustomerInfo = await Purchases.getCustomerInfo();
        setIsPremium(info.entitlements.active['premium'] !== undefined);
      } catch {
        setIsPremium(false);
      } finally {
        setLoading(false);
      }
    }

    init();

    // Listen for changes
    const listener = (info: CustomerInfo) => {
      setIsPremium(info.entitlements.active['premium'] !== undefined);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => Purchases.removeCustomerInfoUpdateListener(listener);
  }, []);

  const restore = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setIsPremium(info.entitlements.active['premium'] !== undefined);
    } catch {
      // silently fail
    }
  };

  return (
    <PremiumContext.Provider value={{ isPremium, loading, restore }}>
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremiumContext = () => useContext(PremiumContext);
```

- [ ] **Step 2: Create Ad unlock context**

`src/context/AdContext.tsx`:
```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface AdState {
  unlockedDays: Set<string>; // YYYY-MM-DD
  unlockDay: (date: string) => void;
  isDayUnlocked: (date: string) => boolean;
}

const AdContext = createContext<AdState>({
  unlockedDays: new Set(),
  unlockDay: () => {},
  isDayUnlocked: () => false,
});

export function AdProvider({ children }: { children: React.ReactNode }) {
  const [unlockedDays, setUnlockedDays] = useState<Set<string>>(new Set());

  const unlockDay = useCallback((date: string) => {
    setUnlockedDays((prev) => new Set([...prev, date]));
  }, []);

  const isDayUnlocked = useCallback(
    (date: string) => {
      const today = new Date().toISOString().split('T')[0];
      if (date === today) return true; // today always unlocked after initial ad
      return unlockedDays.has(date);
    },
    [unlockedDays],
  );

  return (
    <AdContext.Provider value={{ unlockedDays, unlockDay, isDayUnlocked }}>
      {children}
    </AdContext.Provider>
  );
}

export const useAdContext = () => useContext(AdContext);
```

- [ ] **Step 3: Create usePremium hook**

`src/hooks/usePremium.ts`:
```ts
import { usePremiumContext } from '../context/PremiumContext';
import { useAdContext } from '../context/AdContext';

export function usePremium() {
  const { isPremium, loading, restore } = usePremiumContext();
  const { isDayUnlocked, unlockDay } = useAdContext();

  return {
    isPremium,
    loading,
    restore,
    isDayUnlocked: (date: string) => isPremium || isDayUnlocked(date),
    unlockDay,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/context/ src/hooks/usePremium.ts
git commit -m "feat: add Premium and Ad contexts with RevenueCat"
```

---

## Task 14: Core UI Components

**Files:**
- Create: `src/components/MetricsRow.tsx`, `src/components/SafetyBanner.tsx`, `src/components/AmenityTags.tsx`, `src/components/PhotoWithFallback.tsx`, `src/components/WaterQualityBadge.tsx`, `src/components/RestaurantList.tsx`, `src/components/ForecastRow.tsx`, `src/components/OfflineBanner.tsx`

- [ ] **Step 1: Create MetricsRow**

`src/components/MetricsRow.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WeatherData, SeaTempData } from '../types';

interface Props {
  weather: WeatherData | null;
  seaTemp: SeaTempData | null;
  compact?: boolean;
}

export function MetricsRow({ weather, seaTemp, compact = false }: Props) {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={[styles.metric, !compact && styles.metricBox]}>
        {!compact && <Text style={styles.label}>{t('detail.sea')}</Text>}
        <Text style={[styles.value, styles.seaTemp]}>
          🌊 {seaTemp ? `${Math.round(seaTemp.temperature)}°C` : t('errors.noData')}
        </Text>
      </View>
      <View style={[styles.metric, !compact && styles.metricBox]}>
        {!compact && <Text style={styles.label}>{t('detail.air')}</Text>}
        <Text style={[styles.value, styles.airTemp]}>
          ☀️ {weather ? `${weather.airTemp}°C` : t('errors.noData')}
        </Text>
      </View>
      <View style={[styles.metric, !compact && styles.metricBox]}>
        {!compact && <Text style={styles.label}>{t('detail.wind')}</Text>}
        <Text style={[styles.value, styles.wind]}>
          💨 {weather ? `${weather.windSpeed} km/h` : t('errors.noData')}
        </Text>
        {!compact && weather && (
          <Text style={styles.subLabel}>{weather.windDirection}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8 },
  compact: { gap: 12 },
  metric: { flex: 1, alignItems: 'center' },
  metricBox: {
    backgroundColor: '#132238',
    borderRadius: 8,
    padding: 10,
  },
  label: { fontSize: 10, color: '#6b8aaa', textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '700' },
  seaTemp: { color: '#06b6d4' },
  airTemp: { color: '#f59e0b' },
  wind: { color: '#a5b4c4' },
  subLabel: { fontSize: 9, color: '#6b8aaa', marginTop: 2 },
});
```

- [ ] **Step 2: Create SafetyBanner**

`src/components/SafetyBanner.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SafetyData } from '../types';

const COLORS = {
  green: { bg: '#22c55e22', border: '#22c55e44', text: '#22c55e', flag: '#22c55e' },
  orange: { bg: '#f59e0b22', border: '#f59e0b44', text: '#f59e0b', flag: '#f59e0b' },
  red: { bg: '#ef444422', border: '#ef444444', text: '#ef4444', flag: '#ef4444' },
};

interface Props {
  safety: SafetyData | null;
  compact?: boolean;
}

export function SafetyBanner({ safety, compact = false }: Props) {
  const { t } = useTranslation();
  if (!safety) return null;

  const colors = COLORS[safety.level];

  if (compact) {
    return (
      <View style={[styles.dot, { backgroundColor: colors.flag }]} />
    );
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={[styles.flag, { backgroundColor: colors.flag }]} />
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          {t(safety.label)}
        </Text>
        <Text style={styles.reason}>
          {t(safety.reason)} · {safety.source === 'computed' ? t('safety.sourceComputed') : t('safety.sourceNoaa')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  flag: { width: 28, height: 18, borderRadius: 3 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  textContainer: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700' },
  reason: { fontSize: 9, color: '#6b8aaa', marginTop: 2 },
});
```

- [ ] **Step 3: Create AmenityTags**

`src/components/AmenityTags.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Amenities, BeachTags } from '../types';

interface Props {
  amenities: Amenities;
  tags: BeachTags;
  restaurantCount: number;
  compact?: boolean;
}

export function AmenityTags({ amenities, tags, restaurantCount, compact = false }: Props) {
  const { t } = useTranslation();

  const items: Array<{ icon: string; label: string; show: boolean }> = [
    { icon: '🚿', label: t('amenity.showers'), show: amenities.showers },
    { icon: '🚻', label: t('amenity.toilets'), show: amenities.toilets },
    { icon: '🅿️', label: t('amenity.parking'), show: amenities.parking },
    { icon: '♿', label: t('amenity.accessible'), show: amenities.accessible },
    { icon: '🏊', label: t('amenity.lifeguard'), show: amenities.lifeguard },
    { icon: '🐕', label: tags.dog === 'leashed' ? t('amenity.dogLeashed') : t('amenity.dog'), show: tags.dog === 'yes' || tags.dog === 'leashed' },
    { icon: '🍽', label: `${restaurantCount}`, show: restaurantCount > 0 },
  ];

  const visible = items.filter((i) => i.show);
  if (visible.length === 0) return null;

  return (
    <View style={styles.container}>
      {visible.map((item, i) => (
        <View key={i} style={[styles.tag, compact && styles.tagCompact]}>
          <Text style={styles.tagText}>
            {item.icon}{compact ? '' : ` ${item.label}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagCompact: { paddingHorizontal: 5 },
  tagText: { fontSize: 10, color: '#a5b4c4' },
});
```

- [ ] **Step 4: Create PhotoWithFallback**

`src/components/PhotoWithFallback.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PhotoData } from '../types';

const fallbackImage = require('../../assets/images/beach-fallback.jpg');

interface Props {
  photo: PhotoData | null;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export function PhotoWithFallback({ photo, style, imageStyle }: Props) {
  const { t } = useTranslation();
  const [error, setError] = useState(false);

  const showFallback = !photo || photo.isFallback || error;
  const source = showFallback
    ? fallbackImage
    : { uri: photo!.url };

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={[styles.image, imageStyle]}
        resizeMode="cover"
        onError={() => setError(true)}
      />
      {showFallback && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('photo.nonContractuelle')}</Text>
        </View>
      )}
      {!showFallback && photo?.attribution && (
        <View style={styles.attribution}>
          <Text style={styles.attributionText}>{photo.attribution}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { fontSize: 8, color: '#fff' },
  attribution: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  attributionText: { fontSize: 7, color: '#ccc' },
});
```

- [ ] **Step 5: Create WaterQualityBadge**

`src/components/WaterQualityBadge.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WaterQualityData } from '../types';

const GRADE_COLORS = {
  excellent: { bg: '#22c55e', text: '#fff', grade: 'A+' },
  good: { bg: '#3b82f6', text: '#fff', grade: 'A' },
  sufficient: { bg: '#f59e0b', text: '#000', grade: 'B' },
  poor: { bg: '#ef4444', text: '#fff', grade: 'C' },
};

interface Props {
  data: WaterQualityData | null;
  detailed?: boolean;
}

export function WaterQualityBadge({ data, detailed = false }: Props) {
  const { t } = useTranslation();
  if (!data || !data.classification) return null;

  const colors = GRADE_COLORS[data.classification];

  if (!detailed) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.badgeText, { color: colors.text }]}>{colors.grade}</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailContainer}>
      <View style={[styles.gradeBig, { backgroundColor: colors.bg }]}>
        <Text style={[styles.gradeText, { color: colors.text }]}>{colors.grade}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.classification, { color: colors.bg }]}>
          {t(`quality.${data.classification}`)}
        </Text>
        <Text style={styles.source}>
          Source: {data.source === 'eea' ? 'Agence Européenne Environnement' : 'EPA'} · {data.year}
        </Text>
        {data.ecoli !== null && (
          <Text style={styles.detail}>
            E. coli: {data.ecoli} UFC/100ml · Entérocoques: {data.enterococci ?? '—'} UFC/100ml
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  detailContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradeBig: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 14, fontWeight: '700' },
  info: { flex: 1 },
  classification: { fontSize: 12, fontWeight: '700' },
  source: { fontSize: 9, color: '#6b8aaa', marginTop: 2 },
  detail: { fontSize: 10, color: '#a5b4c4', marginTop: 2 },
});
```

- [ ] **Step 6: Create RestaurantList**

`src/components/RestaurantList.tsx`:
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Restaurant } from '../types';

const TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  fast_food: 'Fast-food',
  ice_cream: 'Glacier',
};

interface Props {
  restaurants: Restaurant[];
}

export function RestaurantList({ restaurants }: Props) {
  const { t } = useTranslation();
  if (restaurants.length === 0) return null;

  const openDirections = (r: Restaurant) => {
    const { latitude, longitude } = r.location;
    const url = Platform.select({
      ios: `maps:?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍽 {t('detail.restaurants')}</Text>
      {restaurants.slice(0, 5).map((r, i) => (
        <View key={i} style={styles.item}>
          <View style={styles.info}>
            <Text style={styles.name}>{r.name}</Text>
            <Text style={styles.meta}>
              {TYPE_LABELS[r.type] ?? r.type} · {r.distance}m
            </Text>
          </View>
          <TouchableOpacity onPress={() => openDirections(r)}>
            <Text style={styles.directions}>📍 {t('detail.directions')}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#132238', borderRadius: 8, padding: 10 },
  title: { fontSize: 10, color: '#6b8aaa', textTransform: 'uppercase', marginBottom: 8 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
    backgroundColor: '#1a2d47',
    borderRadius: 6,
    marginBottom: 4,
  },
  info: { flex: 1 },
  name: { fontSize: 12, fontWeight: '700', color: '#fff' },
  meta: { fontSize: 9, color: '#6b8aaa' },
  directions: { fontSize: 10, color: '#3b82f6' },
});
```

- [ ] **Step 7: Create ForecastRow**

`src/components/ForecastRow.tsx`:
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePremium } from '../hooks/usePremium';
import type { ForecastDay } from '../types';

const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
  '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧', '09n': '🌧', '10d': '🌦', '10n': '🌧',
  '11d': '⛈', '11n': '⛈', '13d': '❄️', '13n': '❄️',
  '50d': '🌫', '50n': '🌫',
};

interface Props {
  forecast: ForecastDay[];
  onUnlockDay: (date: string) => void;
}

export function ForecastRow({ forecast, onUnlockDay }: Props) {
  const { t } = useTranslation();
  const { isPremium, isDayUnlocked } = usePremium();

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('detail.forecast')}</Text>
      <View style={styles.row}>
        {forecast.slice(0, 7).map((day, i) => {
          const unlocked = isDayUnlocked(day.date);

          return (
            <TouchableOpacity
              key={day.date}
              style={[styles.day, !unlocked && styles.locked]}
              disabled={unlocked}
              onPress={() => onUnlockDay(day.date)}
            >
              <Text style={styles.dayLabel}>{getDayLabel(day.date)}</Text>
              <Text style={styles.icon}>
                {unlocked ? (WEATHER_ICONS[day.weatherIcon] ?? '☀️') : '🔒'}
              </Text>
              <Text style={[styles.seaTemp, !unlocked && styles.dimmed]}>
                {unlocked ? `${day.seaTemp ?? '—'}°` : '—'}
              </Text>
              <Text style={[styles.airTemp, !unlocked && styles.dimmed]}>
                {unlocked ? `${day.airTemp}°` : '—'}
              </Text>
              <Text style={[styles.wind, !unlocked && styles.dimmed]}>
                {unlocked ? `💨${day.windSpeed}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!isPremium && (
        <TouchableOpacity style={styles.unlockBtn} onPress={() => onUnlockDay('')}>
          <Text style={styles.unlockText}>
            🎬 {t('ads.watchToUnlock')} · {t('ads.orPremium')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#132238', borderRadius: 8, padding: 10 },
  title: { fontSize: 10, color: '#6b8aaa', textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 4 },
  day: {
    flex: 1,
    backgroundColor: '#1a2d47',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  locked: { opacity: 0.3 },
  dayLabel: { fontSize: 10, color: '#6b8aaa' },
  icon: { fontSize: 16, marginVertical: 2 },
  seaTemp: { fontSize: 12, fontWeight: '700', color: '#06b6d4' },
  airTemp: { fontSize: 9, color: '#f59e0b' },
  wind: { fontSize: 8, color: '#a5b4c4' },
  dimmed: { color: '#444' },
  unlockBtn: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  unlockText: { fontSize: 11, color: '#fff' },
});
```

- [ ] **Step 8: Create OfflineBanner**

`src/components/OfflineBanner.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>📡 {t('errors.offline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f59e0b',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: { fontSize: 12, color: '#000', fontWeight: '600' },
});
```

- [ ] **Step 9: Commit**

```bash
git add src/components/
git commit -m "feat: add all core UI components"
```

---

## Task 15: BeachCard + BeachMap Components

**Files:**
- Create: `src/components/BeachCard.tsx`, `src/components/BeachMap.tsx`
- Test: `__tests__/components/BeachCard.test.tsx`

- [ ] **Step 1: Write BeachCard test**

`__tests__/components/BeachCard.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { BeachCard } from '../../src/components/BeachCard';
import type { EnrichedBeach } from '../../src/types';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockBeach: EnrichedBeach = {
  osmId: 'node/123',
  name: 'Plage Test',
  location: { latitude: 43.5, longitude: 7.1 },
  city: 'Nice',
  distance: 2.5,
  tags: { blueFlag: true, dog: 'yes', wheelchair: false, supervised: true, surface: 'sand' },
  weather: { airTemp: 26, feelsLike: 27, windSpeed: 12, windDeg: 315, windDirection: 'NW', uvIndex: 7, visibility: 10, weatherIcon: '01d', weatherDesc: 'clear', sunrise: 0, sunset: 0 },
  seaTemp: { temperature: 21, source: 'copernicus' },
  safety: { level: 'green', label: 'safety.green', reason: 'safety.greenReason', source: 'computed' },
  photo: { url: 'https://example.com/photo.jpg', source: 'wikimedia', attribution: 'WC', isFallback: false },
  waterQuality: null,
  amenities: { showers: true, toilets: true, parking: true, accessible: false, lifeguard: true },
  restaurants: [{ name: 'Café', type: 'cafe', distance: 50, location: { latitude: 43.5, longitude: 7.1 } }],
  forecast: null,
};

describe('BeachCard', () => {
  test('renders beach name and distance', () => {
    const { getByText } = render(<BeachCard beach={mockBeach} onPress={() => {}} />);
    expect(getByText('Plage Test')).toBeTruthy();
    expect(getByText('2.5 km · Nice')).toBeTruthy();
  });

  test('renders sea temp', () => {
    const { getByText } = render(<BeachCard beach={mockBeach} onPress={() => {}} />);
    expect(getByText(/21°C/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/BeachCard.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement BeachCard**

`src/components/BeachCard.tsx`:
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { EnrichedBeach } from '../types';
import { PhotoWithFallback } from './PhotoWithFallback';
import { MetricsRow } from './MetricsRow';
import { SafetyBanner } from './SafetyBanner';
import { AmenityTags } from './AmenityTags';
import { formatDistance } from '../utils/distance';

interface Props {
  beach: EnrichedBeach;
  onPress: () => void;
}

export function BeachCard({ beach, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.photoContainer}>
          <PhotoWithFallback
            photo={beach.photo}
            style={styles.photo}
            imageStyle={styles.photoImage}
          />
          {/* Badge overlays */}
          <View style={styles.badges}>
            {beach.tags.blueFlag && (
              <View style={styles.badgeBlue}><Text style={styles.badgeText}>🏅</Text></View>
            )}
            {(beach.tags.dog === 'yes' || beach.tags.dog === 'leashed') && (
              <View style={styles.badgeDog}><Text style={styles.badgeText}>🐕</Text></View>
            )}
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.header}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1}>{beach.name}</Text>
              <Text style={styles.location}>
                {formatDistance(beach.distance)} · {beach.city ?? ''}
              </Text>
            </View>
            <SafetyBanner safety={beach.safety} compact />
          </View>

          <MetricsRow weather={beach.weather} seaTemp={beach.seaTemp} compact />

          <AmenityTags
            amenities={beach.amenities}
            tags={beach.tags}
            restaurantCount={beach.restaurants.length}
            compact
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#132238',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  row: { flexDirection: 'row' },
  photoContainer: { width: 90, height: 80, position: 'relative' },
  photo: { width: 90, height: 80 },
  photoImage: { width: 90, height: 80 },
  badges: { position: 'absolute', bottom: 2, left: 2, flexDirection: 'row', gap: 2 },
  badgeBlue: { backgroundColor: '#3b82f6', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 3 },
  badgeDog: { backgroundColor: '#8b5cf6', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 3 },
  badgeText: { fontSize: 8 },
  info: { flex: 1, padding: 8, gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nameContainer: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: '#fff' },
  location: { fontSize: 10, color: '#6b8aaa', marginTop: 1 },
});
```

- [ ] **Step 4: Implement BeachMap**

`src/components/BeachMap.tsx`:
```tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Coordinates, EnrichedBeach } from '../types';

const PIN_COLORS = {
  green: '#22c55e',
  orange: '#f59e0b',
  red: '#ef4444',
};

interface Props {
  userLocation: Coordinates;
  beaches: EnrichedBeach[];
  onBeachPress: (index: number) => void;
}

export function BeachMap({ userLocation, beaches, onBeachPress }: Props) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }}
      showsUserLocation
      showsMyLocationButton
    >
      {beaches.map((beach, index) => (
        <Marker
          key={beach.osmId}
          coordinate={beach.location}
          title={beach.name}
          description={
            beach.seaTemp
              ? `🌊 ${Math.round(beach.seaTemp.temperature)}°C`
              : undefined
          }
          pinColor={PIN_COLORS[beach.safety?.level ?? 'green']}
          onCalloutPress={() => onBeachPress(index)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: 200, borderRadius: 0 },
});
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/components/BeachCard.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/BeachCard.tsx src/components/BeachMap.tsx __tests__/components/BeachCard.test.tsx
git commit -m "feat: add BeachCard and BeachMap components"
```

---

## Task 16: App Navigation + Screens

**Files:**
- Create: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/search.tsx`, `app/(tabs)/favorites.tsx`, `app/(tabs)/settings.tsx`, `app/beach/[id].tsx`

- [ ] **Step 1: Create root layout**

`app/_layout.tsx`:
```tsx
import '../src/i18n';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PremiumProvider } from '../src/context/PremiumContext';
import { AdProvider } from '../src/context/AdContext';
import { localCache } from '../src/lib/cache';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    localCache.init().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <PremiumProvider>
      <AdProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="beach/[id]"
            options={{ presentation: 'card', animation: 'slide_from_right' }}
          />
        </Stack>
      </AdProvider>
    </PremiumProvider>
  );
}
```

- [ ] **Step 2: Create tab layout**

`app/(tabs)/_layout.tsx`:
```tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b8aaa',
        tabBarStyle: {
          backgroundColor: '#0d1d33',
          borderTopColor: '#1e3a5f',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home.title'),
          tabBarIcon: ({ color }) => <TabIcon emoji="🏖" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('search.title'),
          tabBarIcon: ({ color }) => <TabIcon emoji="🔍" color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('favorites.title'),
          tabBarIcon: ({ color }) => <TabIcon emoji="⭐" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji }: { emoji: string; color: string }) {
  return <import('react-native').Text style={{ fontSize: 20 }}>{emoji}</import('react-native').Text>;
}
```

Wait — that won't compile. Fix the TabIcon:

`app/(tabs)/_layout.tsx` (corrected):
```tsx
import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b8aaa',
        tabBarStyle: {
          backgroundColor: '#0d1d33',
          borderTopColor: '#1e3a5f',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home.title'),
          tabBarIcon: () => <TabIcon emoji="🏖" />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('search.title'),
          tabBarIcon: () => <TabIcon emoji="🔍" />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('favorites.title'),
          tabBarIcon: () => <TabIcon emoji="⭐" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.title'),
          tabBarIcon: () => <TabIcon emoji="⚙️" />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 3: Create Home screen**

`app/(tabs)/index.tsx`:
```tsx
import React, { useRef } from 'react';
import { View, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../../src/hooks/useLocation';
import { useNearbyBeaches } from '../../src/hooks/useNearbyBeaches';
import { BeachMap } from '../../src/components/BeachMap';
import { BeachCard } from '../../src/components/BeachCard';
import type { EnrichedBeach } from '../../src/types';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { location, error: locError, loading: locLoading } = useLocation();
  const { beaches, loading, error } = useNearbyBeaches(location);
  const listRef = useRef<FlatList>(null);

  const handleBeachPress = (beach: EnrichedBeach, index: number) => {
    router.push({ pathname: '/beach/[id]', params: { id: beach.osmId, index: String(index) } });
  };

  const handleMapBeachPress = (index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
  };

  if (locLoading || (loading && beaches.length === 0)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{t('home.title')}...</Text>
      </View>
    );
  }

  if (locError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('errors.noGps')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location && (
        <BeachMap
          userLocation={location}
          beaches={beaches}
          onBeachPress={handleMapBeachPress}
        />
      )}

      {error === 'no_beaches' ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('home.noBeaches')}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={beaches}
          keyExtractor={(b) => b.osmId}
          renderItem={({ item, index }) => (
            <BeachCard beach={item} onPress={() => handleBeachPress(item, index)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1628' },
  loadingText: { color: '#6b8aaa', marginTop: 12, fontSize: 14 },
  errorText: { color: '#f59e0b', fontSize: 14, textAlign: 'center', padding: 20 },
  emptyText: { color: '#6b8aaa', fontSize: 14 },
  list: { padding: 12, paddingBottom: 100 },
});
```

- [ ] **Step 4: Create Beach Detail screen**

`app/beach/[id].tsx`:
```tsx
import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useNearbyBeaches } from '../../src/hooks/useNearbyBeaches';
import { useBeachDetail } from '../../src/hooks/useBeachDetail';
import { useLocation } from '../../src/hooks/useLocation';
import { PhotoWithFallback } from '../../src/components/PhotoWithFallback';
import { MetricsRow } from '../../src/components/MetricsRow';
import { SafetyBanner } from '../../src/components/SafetyBanner';
import { AmenityTags } from '../../src/components/AmenityTags';
import { RestaurantList } from '../../src/components/RestaurantList';
import { WaterQualityBadge } from '../../src/components/WaterQualityBadge';
import { ForecastRow } from '../../src/components/ForecastRow';
import { formatDistance } from '../../src/utils/distance';

const { width } = Dimensions.get('window');

export default function BeachDetailScreen() {
  const { id, index } = useLocalSearchParams<{ id: string; index: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { location } = useLocation();
  const { beaches } = useNearbyBeaches(location);
  const beach = beaches[parseInt(index ?? '0', 10)] ?? null;
  const { forecast, waterQuality } = useBeachDetail(beach);

  if (!beach) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{t('errors.noData')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Hero photo */}
      <View style={styles.hero}>
        <PhotoWithFallback
          photo={beach.photo}
          style={styles.heroPhoto}
          imageStyle={{ width, height: 200 }}
        />
        <View style={styles.heroOverlay}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.heroName}>{beach.name}</Text>
          <Text style={styles.heroLocation}>
            {beach.city} · {formatDistance(beach.distance)}
          </Text>
        </View>
        {/* Badges */}
        <View style={styles.heroBadges}>
          {beach.tags.blueFlag && (
            <View style={styles.badgeBlue}><Text style={styles.badgeText}>🏅 {t('detail.blueFlag')}</Text></View>
          )}
          {(beach.tags.dog === 'yes' || beach.tags.dog === 'leashed') && (
            <View style={styles.badgeDog}><Text style={styles.badgeText}>🐕</Text></View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {/* Key metrics */}
        <MetricsRow weather={beach.weather} seaTemp={beach.seaTemp} />

        {/* Safety banner */}
        <SafetyBanner safety={beach.safety} />

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('detail.amenities')}</Text>
          <AmenityTags
            amenities={beach.amenities}
            tags={beach.tags}
            restaurantCount={beach.restaurants.length}
          />
        </View>

        {/* Restaurants */}
        <RestaurantList restaurants={beach.restaurants} />

        {/* Water quality */}
        {waterQuality && (
          <View style={[styles.section, styles.sectionBox]}>
            <Text style={styles.sectionTitle}>💧 {t('detail.waterQuality')}</Text>
            <WaterQualityBadge data={waterQuality} detailed />
          </View>
        )}

        {/* Blue Flag */}
        {beach.tags.blueFlag && (
          <View style={styles.blueFlagBanner}>
            <Text style={styles.blueFlagTitle}>🏅 {t('detail.blueFlag')} 2025</Text>
            <Text style={styles.blueFlagDesc}>{t('detail.blueFlagDesc')}</Text>
          </View>
        )}

        {/* Forecast */}
        {forecast && (
          <ForecastRow
            forecast={forecast}
            onUnlockDay={(date) => {
              // Show ad gate (handled by AdGate component)
            }}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1628' },
  text: { color: '#fff' },
  hero: { height: 200, position: 'relative' },
  heroPhoto: { width: '100%', height: 200 },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 12, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  },
  backBtn: { position: 'absolute', top: 50, left: 12 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  heroName: { fontSize: 18, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  heroLocation: { fontSize: 11, color: '#ddd' },
  heroBadges: { position: 'absolute', top: 50, right: 8, flexDirection: 'row', gap: 4 },
  badgeBlue: { backgroundColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeDog: { backgroundColor: '#8b5cf6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, color: '#fff' },
  content: { padding: 12, gap: 12 },
  section: { gap: 8 },
  sectionBox: { backgroundColor: '#132238', borderRadius: 8, padding: 10 },
  sectionTitle: { fontSize: 10, color: '#6b8aaa', textTransform: 'uppercase' },
  blueFlagBanner: {
    backgroundColor: '#3b82f622',
    borderWidth: 1,
    borderColor: '#3b82f644',
    borderRadius: 8,
    padding: 10,
  },
  blueFlagTitle: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
  blueFlagDesc: { fontSize: 9, color: '#6b8aaa', marginTop: 4 },
});
```

- [ ] **Step 5: Create Search screen**

`app/(tabs)/search.tsx`:
```tsx
import React, { useState, useCallback } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../../src/hooks/useLocation';
import { useNearbyBeaches } from '../../src/hooks/useNearbyBeaches';
import { BeachCard } from '../../src/components/BeachCard';
import type { EnrichedBeach } from '../../src/types';

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { location } = useLocation();
  const { beaches } = useNearbyBeaches(location);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(filter) ? next.delete(filter) : next.add(filter);
      return next;
    });
  };

  const filtered = beaches.filter((b) => {
    const matchesQuery =
      !query ||
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      (b.city ?? '').toLowerCase().includes(query.toLowerCase());

    const matchesFilters =
      (!activeFilters.has('blueFlag') || b.tags.blueFlag) &&
      (!activeFilters.has('seaTemp') || (b.seaTemp && b.seaTemp.temperature >= 20)) &&
      (!activeFilters.has('lowWind') || (b.weather && b.weather.windSpeed < 15)) &&
      (!activeFilters.has('excellentWater') || (b.waterQuality?.classification === 'excellent'));

    return matchesQuery && matchesFilters;
  });

  const filters = [
    { key: 'blueFlag', label: t('search.filters.blueFlag') },
    { key: 'seaTemp', label: t('search.filters.seaTemp') },
    { key: 'lowWind', label: t('search.filters.lowWind') },
    { key: 'excellentWater', label: t('search.filters.excellentWater') },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={t('search.placeholder')}
          placeholderTextColor="#6b8aaa"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.filters}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, activeFilters.has(f.key) && styles.chipActive]}
            onPress={() => toggleFilter(f.key)}
          >
            <Text style={[styles.chipText, activeFilters.has(f.key) && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.osmId}
        renderItem={({ item, index }) => (
          <BeachCard
            beach={item}
            onPress={() => router.push({ pathname: '/beach/[id]', params: { id: item.osmId, index: String(index) } })}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', paddingTop: 60 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    backgroundColor: '#132238',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 15, color: '#fff' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, marginBottom: 12 },
  chip: { backgroundColor: '#1e3a5f', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  chipActive: { backgroundColor: '#3b82f6' },
  chipText: { fontSize: 11, color: '#a5b4c4' },
  chipTextActive: { color: '#fff' },
  list: { padding: 12, paddingBottom: 100 },
});
```

- [ ] **Step 6: Create Favorites screen**

`app/(tabs)/favorites.tsx`:
```tsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../src/lib/supabase';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<Array<{ osm_id: string; beach_name: string }>>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('favorites')
        .select('osm_id, beach_name, lat, lng')
        .order('created_at', { ascending: false });
      if (data) setFavorites(data);
    }
    load();
  }, []);

  if (favorites.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>⭐</Text>
        <Text style={styles.emptyText}>{t('favorites.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('favorites.title')}</Text>
      <FlatList
        data={favorites}
        keyExtractor={(f) => f.osm_id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>🏖 {item.beach_name ?? item.osm_id}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1628' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#6b8aaa', fontSize: 14 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', padding: 16 },
  list: { padding: 16 },
  item: {
    backgroundColor: '#132238',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  name: { fontSize: 14, color: '#fff' },
});
```

- [ ] **Step 7: Create Settings screen**

`app/(tabs)/settings.tsx`:
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../../src/i18n';
import { localCache } from '../../src/lib/cache';
import { usePremiumContext } from '../../src/context/PremiumContext';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { isPremium, restore } = usePremiumContext();

  const toggleLanguage = () => {
    const next = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(next);
  };

  const clearCache = async () => {
    await localCache.clearAll();
    Alert.alert('Cache vidé');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={toggleLanguage}>
          <Text style={styles.label}>🌍 {t('settings.language')}</Text>
          <Text style={styles.value}>{i18n.language === 'fr' ? 'Français' : 'English'}</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.label}>📏 {t('settings.units')}</Text>
          <Text style={styles.value}>{t('settings.metric')}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>🎨 {t('settings.theme')}</Text>
          <Text style={styles.value}>{t('settings.themeAuto')}</Text>
        </View>

        <TouchableOpacity style={styles.row} onPress={clearCache}>
          <Text style={styles.label}>🗑 {t('settings.clearCache')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>⭐ Premium</Text>
          <Text style={[styles.value, isPremium && styles.premium]}>
            {isPremium ? '✅ Actif' : '❌ Inactif'}
          </Text>
        </View>

        {!isPremium && (
          <TouchableOpacity style={styles.premiumBtn}>
            <Text style={styles.premiumBtnText}>{t('settings.manageSub')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.row} onPress={restore}>
          <Text style={styles.label}>{t('premium.restore')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', padding: 16 },
  section: { marginHorizontal: 16, backgroundColor: '#132238', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e3a5f',
  },
  label: { fontSize: 14, color: '#fff' },
  value: { fontSize: 14, color: '#6b8aaa' },
  premium: { color: '#22c55e' },
  premiumBtn: {
    backgroundColor: '#3b82f6', margin: 12, padding: 12,
    borderRadius: 8, alignItems: 'center',
  },
  premiumBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
```

- [ ] **Step 8: Verify the app runs**

```bash
npx expo start
```

Expected: App starts with tab navigation, Home shows loading then map + beach list.

- [ ] **Step 9: Commit**

```bash
git add app/
git commit -m "feat: add all screens and navigation (Home, Detail, Search, Favorites, Settings)"
```

---

## Task 17: AdMob Rewarded Video Integration

**Files:**
- Create: `src/components/AdGate.tsx`

- [ ] **Step 1: Create AdGate component**

`src/components/AdGate.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { useTranslation } from 'react-i18next';
import { usePremium } from '../hooks/usePremium';

const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxx/yyy'; // Replace with real ID

interface Props {
  visible: boolean;
  dateToUnlock: string;
  onDismiss: () => void;
  onUnlocked: (date: string) => void;
  onGoPremium: () => void;
}

export function AdGate({ visible, dateToUnlock, onDismiss, onUnlocked, onGoPremium }: Props) {
  const { t } = useTranslation();
  const { isPremium } = usePremium();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adInstance, setAdInstance] = useState<RewardedAd | null>(null);

  useEffect(() => {
    if (isPremium || !visible) return;

    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setAdLoaded(true),
    );
    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => onUnlocked(dateToUnlock),
    );
    const unsubClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => onDismiss(),
    );

    rewarded.load();
    setAdInstance(rewarded);

    return () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
    };
  }, [visible, isPremium]);

  // If ad fails to load after 5s, grant access anyway
  useEffect(() => {
    if (!visible || isPremium) return;
    const timeout = setTimeout(() => {
      if (!adLoaded) {
        onUnlocked(dateToUnlock);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [visible, adLoaded]);

  if (isPremium) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>🎬</Text>

          {adLoaded ? (
            <TouchableOpacity
              style={styles.watchBtn}
              onPress={() => adInstance?.show()}
            >
              <Text style={styles.watchText}>{t('ads.watchToUnlock')}</Text>
            </TouchableOpacity>
          ) : (
            <ActivityIndicator color="#3b82f6" style={{ marginVertical: 16 }} />
          )}

          <TouchableOpacity style={styles.premiumBtn} onPress={onGoPremium}>
            <Text style={styles.premiumText}>⭐ {t('ads.orPremium')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.dismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: '#132238', borderRadius: 16, padding: 24,
    alignItems: 'center', width: 280,
  },
  title: { fontSize: 40, marginBottom: 12 },
  watchBtn: {
    backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, marginBottom: 12,
  },
  watchText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  premiumBtn: {
    borderWidth: 1, borderColor: '#f59e0b', paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 12,
  },
  premiumText: { color: '#f59e0b', fontWeight: '600', fontSize: 13 },
  dismiss: { color: '#6b8aaa', marginTop: 16, fontSize: 18 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AdGate.tsx
git commit -m "feat: add AdMob rewarded video gate component"
```

---

## Task 18: Supabase Edge Function — Copernicus SST Cron

**Files:**
- Create: `supabase/functions/fetch-sst/index.ts`

- [ ] **Step 1: Create the edge function**

`supabase/functions/fetch-sst/index.ts`:
```ts
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
      .select('lat:location->coordinates->>1, lng:location->coordinates->>0')
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
```

- [ ] **Step 2: Add pg_cron schedule in Supabase SQL Editor**

```sql
-- Run in Supabase SQL Editor (requires pg_cron extension)
SELECT cron.schedule(
  'fetch-sst-every-6h',
  '0 */6 * * *',
  $$SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/fetch-sst',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );$$
);
```

- [ ] **Step 3: Deploy edge function**

```bash
npx supabase functions deploy fetch-sst
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/
git commit -m "feat: add Copernicus SST edge function with 6h cron"
```

---

## Task 19: Fallback Beach Photo Asset + Final Wiring

**Files:**
- Create: `assets/images/beach-fallback.jpg`
- Modify: `app/_layout.tsx` (add initial ad gate on app open)

- [ ] **Step 1: Add fallback beach photo**

Download a free beach photo from Unsplash or use a placeholder:
```bash
curl -L "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80" -o assets/images/beach-fallback.jpg
```

- [ ] **Step 2: Wire up initial ad gate in root layout**

Update `app/_layout.tsx` to show ad on first launch (non-premium):

Add to `RootLayout`:
```tsx
const [initialAdShown, setInitialAdShown] = useState(false);
const { isPremium } = usePremiumContext();

// Show ad gate on first open for non-premium users
const showInitialAd = !isPremium && !initialAdShown;
```

Add `<AdGate>` component before `</AdProvider>` closing tag, with `dateToUnlock` set to today's date.

- [ ] **Step 3: Final test — run the app**

```bash
npx expo start
```

Expected: Full flow works — location → map + beach list → tap card → detail with all data → forecast locked → ad gate.

- [ ] **Step 4: Commit**

```bash
git add assets/images/beach-fallback.jpg app/_layout.tsx
git commit -m "feat: add fallback photo and wire initial ad gate"
```

---

## Task 20: Integration Test + Final Cleanup

- [ ] **Step 1: Run all tests**

```bash
npx jest --coverage
```

Expected: All tests pass. Review coverage report for gaps.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Run linter**

```bash
npx expo lint
```

Expected: No errors. Fix any warnings.

- [ ] **Step 4: Test on physical device**

```bash
npx expo start --dev-client
```

Test on both iOS and Android:
- GPS permission flow
- Beach list loads with real data
- Map shows pins
- Detail screen shows all sections
- Search filters work
- Language toggle works
- Offline banner appears when disconnecting

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup, all tests passing"
```
