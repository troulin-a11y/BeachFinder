export const API = {
  OVERPASS_URL: 'https://overpass-api.de/api/interpreter',
  OWM_CURRENT_URL: 'https://api.openweathermap.org/data/2.5/weather',
  OWM_ONECALL_URL: 'https://api.openweathermap.org/data/3.0/onecall',
  NOAA_COOPS_URL: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter',
  NOAA_STATIONS_URL: 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json',
  EEA_DISCODATA_URL: 'https://discodata.eea.europa.eu/sql',
  EPA_BEACON_URL: 'https://watersgeo.epa.gov/beacon2',
  WIKIMEDIA_API_URL: 'https://commons.wikimedia.org/w/api.php',
  FLICKR_API_URL: 'https://api.flickr.com/services/rest/',
  UNSPLASH_API_URL: 'https://api.unsplash.com',
  CATALONIA_FLAGS_URL: 'https://platges.interior.gencat.cat/api',
} as const;

export const CACHE_TTL = {
  BEACHES: 24 * 60 * 60 * 1000,
  WEATHER: 60 * 60 * 1000,
  SEA_TEMP: 6 * 60 * 60 * 1000,
  PHOTOS: 30 * 24 * 60 * 60 * 1000,
  WATER_QUALITY: 365 * 24 * 60 * 60 * 1000,
  AMENITIES: 24 * 60 * 60 * 1000,
} as const;

export const SEARCH_RADIUS_M = 50_000;
export const SEARCH_RADIUS_EXPANDED_M = 100_000;
export const MAX_BEACHES = 20;
export const AMENITY_RADIUS_M = 300;

export const SAFETY_THRESHOLDS = {
  WIND_RED: 40,
  WIND_ORANGE: 25,
  WAVES_RED: 1.5,
  WAVES_ORANGE: 1.0,
} as const;

export const WIND_DIRECTIONS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
] as const;
