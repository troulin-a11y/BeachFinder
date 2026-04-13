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
  distance: number;
  tags: BeachTags;
}

export interface WeatherData {
  airTemp: number;
  feelsLike: number;
  windSpeed: number;
  windDeg: number;
  windDirection: string;
  uvIndex: number;
  visibility: number;
  weatherIcon: string;
  weatherDesc: string;
  sunrise: number;
  sunset: number;
}

export interface ForecastDay {
  date: string;
  airTemp: number;
  seaTemp: number | null;
  windSpeed: number;
  weatherIcon: string;
  weatherDesc: string;
}

export interface SeaTempData {
  temperature: number;
  source: 'noaa' | 'copernicus';
  stationName?: string;
}

export type SafetyLevel = 'green' | 'orange' | 'red';

export interface SafetyData {
  level: SafetyLevel;
  label: string;
  reason: string;
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
  source: 'wikimedia' | 'flickr' | 'unsplash' | 'pexels' | 'pixabay' | 'fallback';
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
  distance: number;
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
