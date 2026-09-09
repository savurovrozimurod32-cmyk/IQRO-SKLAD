import { z } from 'zod';
import { getEnv } from '../config/env.js';
import { zonedDateISO } from '../utils/datetime.js';
import { logger, errorMessage } from '../utils/logger.js';
import { fromWeatherApiCode } from '../weather/conditions.js';
import { clampPercent, isNum } from '../weather/normalize.js';
import type { WeatherSourceResult } from '../weather/types.js';
import { fetchJson } from './http.js';

const Condition = z.object({ code: z.number().nullable().optional() }).optional();

const Schema = z.object({
  current: z
    .object({
      temp_c: z.number().nullable().optional(),
      humidity: z.number().nullable().optional(),
      wind_kph: z.number().nullable().optional(),
      gust_kph: z.number().nullable().optional(),
      precip_mm: z.number().nullable().optional(),
      condition: Condition,
    })
    .optional(),
  forecast: z
    .object({
      forecastday: z
        .array(
          z.object({
            date: z.string().optional(),
            day: z
              .object({
                maxtemp_c: z.number().nullable().optional(),
                mintemp_c: z.number().nullable().optional(),
                daily_chance_of_rain: z.union([z.number(), z.string()]).nullable().optional(),
                totalprecip_mm: z.number().nullable().optional(),
                maxwind_kph: z.number().nullable().optional(),
                avghumidity: z.number().nullable().optional(),
                condition: Condition,
              })
              .optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

const toNum = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'string' ? Number(v) : v;
  return isNum(n) ? n : null;
};

export async function fetchWeatherApi(): Promise<WeatherSourceResult> {
  const env = getEnv();
  const fetchedAt = new Date().toISOString();
  const forecastDate = zonedDateISO(env.WEATHER_TIMEZONE);

  const base: WeatherSourceResult = {
    source: 'weatherapi',
    fetchedAt,
    forecastDate,
    currentTemperatureC: null,
    minTemperatureC: null,
    maxTemperatureC: null,
    condition: 'unknown',
    precipitationProbability: null,
    precipitationMm: null,
    windSpeedKmh: null,
    windGustKmh: null,
    humidityPercent: null,
    success: false,
  };

  // Key bo'lmasa — development uchun aniq warning, lekin butun job yiqilmasin.
  if (!env.WEATHERAPI_KEY) {
    logger.warn(
      'weatherapi',
      'WEATHERAPI_KEY topilmadi — bu provider o‘tkazib yuborildi (.env ni to‘ldiring).',
    );
    return { ...base, success: false, error: 'WEATHERAPI_KEY sozlanmagan' };
  }

  try {
    const q = `${env.WEATHER_LAT},${env.WEATHER_LON}`;
    const url =
      `https://api.weatherapi.com/v1/forecast.json` +
      `?key=${encodeURIComponent(env.WEATHERAPI_KEY)}` +
      `&q=${encodeURIComponent(q)}&days=1&aqi=no&alerts=no`;

    const raw = await fetchJson<unknown>('weatherapi', url);
    const data = Schema.parse(raw);

    const day = data.forecast?.forecastday?.[0]?.day;
    const dayCode = day?.condition?.code ?? null;
    const currentCode = data.current?.condition?.code ?? null;

    return {
      ...base,
      forecastDate: data.forecast?.forecastday?.[0]?.date ?? forecastDate,
      currentTemperatureC: isNum(data.current?.temp_c) ? (data.current!.temp_c as number) : null,
      minTemperatureC: day?.mintemp_c ?? null,
      maxTemperatureC: day?.maxtemp_c ?? null,
      condition: fromWeatherApiCode(dayCode ?? currentCode),
      precipitationProbability: clampPercent(toNum(day?.daily_chance_of_rain)),
      precipitationMm: day?.totalprecip_mm ?? null,
      windSpeedKmh: day?.maxwind_kph ?? data.current?.wind_kph ?? null,
      windGustKmh: data.current?.gust_kph ?? null,
      humidityPercent: clampPercent(data.current?.humidity ?? day?.avghumidity ?? null),
      success: true,
    };
  } catch (err) {
    // 401/403 -> key muammosi, aniq xabar
    const msg = errorMessage(err);
    const hint = /401|403/.test(msg) ? ' (WEATHERAPI_KEY noto‘g‘ri yoki muddати tugagan)' : '';
    return { ...base, success: false, error: `${msg}${hint}` };
  }
}
