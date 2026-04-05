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

export async function fetchForecast(
  lat: number,
  lng: number,
): Promise<{ weather: WeatherData; forecast: ForecastDay[] }> {
  const url = new URL(API.OWM_ONECALL_URL);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('units', 'metric');
  url.searchParams.set('exclude', 'minutely,hourly,alerts');
  url.searchParams.set('appid', OWM_API_KEY ?? '');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`OpenWeatherMap One Call error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OWMOneCallResponse;

  const weather = parseCurrentWeather(data.current);
  const forecast = parseForecast(data.daily);

  return { weather, forecast };
}
