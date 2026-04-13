import { API } from '../constants';
import { degToCompass } from '../utils/distance';
import type { WeatherData, ForecastDay } from '../types';

const OWM_API_KEY = process.env.EXPO_PUBLIC_OWM_API_KEY;

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

// OWM current weather response shape (relevant fields only)
interface OWMCurrentResponse {
  main: {
    temp: number;
    feels_like: number;
  };
  wind: {
    speed: number; // m/s
    deg: number;
  };
  visibility: number; // metres
  weather: Array<{ icon: string; description: string }>;
  sys: {
    sunrise: number;
    sunset: number;
  };
  // uvi is only present in the One Call response; absent from current weather
  uvi?: number;
}

// OWM One Call daily entry shape (relevant fields only)
interface OWMDailyEntry {
  dt: number;
  temp: { day: number };
  wind_speed: number; // m/s
  uvi: number;
  weather: Array<{ icon: string; description: string }>;
}

// OWM One Call response shape (relevant fields only)
interface OWMOneCallResponse {
  current: OWMCurrentResponse & { uvi: number };
  daily: OWMDailyEntry[];
}

export function parseCurrentWeather(data: OWMCurrentResponse & { uvi?: number }): WeatherData {
  const windSpeedKmh = Math.round(data.wind.speed * 3.6);
  const weatherEntry = data.weather[0];

  return {
    airTemp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    windSpeed: windSpeedKmh,
    windDeg: data.wind.deg,
    windDirection: degToCompass(data.wind.deg),
    uvIndex: data.uvi ?? 0,
    visibility: Math.round(data.visibility / 1000), // convert m → km
    weatherIcon: weatherEntry?.icon ?? '',
    weatherDesc: weatherEntry?.description ?? '',
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
  };
}

export function parseForecast(daily: OWMDailyEntry[]): ForecastDay[] {
  return daily.slice(0, 7).map((day) => {
    const weatherEntry = day.weather[0];
    const date = new Date(day.dt * 1000).toISOString().split('T')[0];
    return {
      date,
      airTemp: Math.round(day.temp.day),
      seaTemp: null, // filled later by seaTemp module
      windSpeed: Math.round(day.wind_speed * 3.6),
      weatherIcon: weatherEntry?.icon ?? '',
      weatherDesc: weatherEntry?.description ?? '',
    };
  });
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

export async function fetchCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = new URL(API.OWM_CURRENT_URL);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('units', 'metric');
  url.searchParams.set('appid', OWM_API_KEY ?? '');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`OpenWeatherMap current weather error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OWMCurrentResponse;
  return parseCurrentWeather(data);
}

// Free 5-day/3-hour forecast API (2.5) — aggregated to daily
interface OWMForecast25Entry {
  dt: number;
  main: { temp: number; feels_like: number };
  wind: { speed: number; deg: number };
  weather: Array<{ icon: string; description: string }>;
  dt_txt: string;
}

interface OWMForecast25Response {
  list: OWMForecast25Entry[];
}

function aggregateDailyForecast(entries: OWMForecast25Entry[]): ForecastDay[] {
  const byDate = new Map<string, OWMForecast25Entry[]>();
  for (const e of entries) {
    const date = e.dt_txt.split(' ')[0];
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(e);
  }

  const days: ForecastDay[] = [];
  for (const [date, group] of byDate) {
    // Pick the midday entry (12:00) or the middle entry as representative
    const midday = group.find((e) => e.dt_txt.includes('12:00')) ?? group[Math.floor(group.length / 2)];
    const maxTemp = Math.max(...group.map((e) => e.main.temp));
    const avgWind = group.reduce((s, e) => s + e.wind.speed, 0) / group.length;

    days.push({
      date,
      airTemp: Math.round(maxTemp),
      seaTemp: null,
      windSpeed: Math.round(avgWind * 3.6),
      weatherIcon: midday.weather[0]?.icon ?? '',
      weatherDesc: midday.weather[0]?.description ?? '',
    });
  }

  return days.slice(0, 6);
}

export async function fetchForecast(
  lat: number,
  lng: number,
): Promise<{ weather: WeatherData; forecast: ForecastDay[] }> {
  // Try free 5-day forecast API first
  const freeUrl = new URL(API.OWM_FORECAST_URL);
  freeUrl.searchParams.set('lat', String(lat));
  freeUrl.searchParams.set('lon', String(lng));
  freeUrl.searchParams.set('units', 'metric');
  freeUrl.searchParams.set('appid', OWM_API_KEY ?? '');

  const freeRes = await fetch(freeUrl.toString());
  if (freeRes.ok) {
    const data = (await freeRes.json()) as OWMForecast25Response;
    const forecast = aggregateDailyForecast(data.list);
    // Also fetch current weather for the WeatherData
    const weather = await fetchCurrentWeather(lat, lng);
    return { weather, forecast };
  }

  // Fallback to OneCall 3.0 if available
  const url = new URL(API.OWM_ONECALL_URL);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('units', 'metric');
  url.searchParams.set('exclude', 'minutely,hourly,alerts');
  url.searchParams.set('appid', OWM_API_KEY ?? '');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`OpenWeatherMap forecast error: ${response.status}`);
  }

  const data = (await response.json()) as OWMOneCallResponse;
  const weather = parseCurrentWeather(data.current);
  const forecast = parseForecast(data.daily);

  return { weather, forecast };
}
