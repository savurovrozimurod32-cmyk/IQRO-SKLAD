import { z } from 'zod';
import { getEnv } from '../config/env.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage } from '../utils/logger.js';
import { fromOpenMeteoCode } from '../weather/conditions.js';
import { clampPercent, isNum } from '../weather/normalize.js';
import type { WeatherSourceResult } from '../weather/types.js';
import { fetchJson } from './http.js';

const Schema = z.object({
  current: z
    .object({
      temperature_2m: z.number().nullable().optional(),
      relative_humidity_2m: z.number().nullable().optional(),
      weather_code: z.number().nullable().optional(),
    })
    .optional(),
  daily: z
    .object({
      time: z.array(z.string()).optional(),
      weather_code: z.array(z.number().nullable()).optional(),
      temperature_2m_max: z.array(z.number().nullable()).optional(),
      temperature_2m_min: z.array(z.number().nullable()).optional(),
      precipitation_probability_max: z.array(z.number().nullable()).optional(),
      precipitation_sum: z.array(z.number().nullable()).optional(),
      wind_speed_10m_max: z.array(z.number().nullable()).optional(),
      wind_gusts_10m_max: z.array(z.number().nullable()).optional(),
    })
    .optional(),
});

const first = (arr?: Array<number | null>): number | null =>
  arr && arr.length > 0 && isNum(arr[0]) ? (arr[0] as number) : null;

export async function fetchOpenMeteo(): Promise<WeatherSourceResult> {
  const env = getEnv();
  const fetchedAt = new Date().toISOString();
  const forecastDate = zonedDateISO(env.WEATHER_TIMEZONE);

  const base: WeatherSourceResult = {
    source: 'open-meteo',
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

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${env.WEATHER_LAT}&longitude=${env.WEATHER_LON}` +
      `&timezone=${encodeURIComponent(env.WEATHER_TIMEZONE)}` +
      `&forecast_days=1&wind_speed_unit=kmh` +
      `&current=temperature_2m,relative_humidity_2m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,` +
      `precipitation_probability_max,precipitation_sum,` +
      `wind_speed_10m_max,wind_gusts_10m_max`;

    const raw = await fetchJson<unknown>('open-meteo', url);
    const data = Schema.parse(raw);

    const daily = data.daily;
    const dailyCode = first(daily?.weather_code);
    const currentCode = data.current?.weather_code ?? null;

    return {
      ...base,
      forecastDate: daily?.time?.[0] ?? forecastDate,
      currentTemperatureC: isNum(data.current?.temperature_2m)
        ? (data.current!.temperature_2m as number)
        : null,
      minTemperatureC: first(daily?.temperature_2m_min),
      maxTemperatureC: first(daily?.temperature_2m_max),
      condition: fromOpenMeteoCode(dailyCode ?? currentCode),
      precipitationProbability: clampPercent(first(daily?.precipitation_probability_max)),
      precipitationMm: first(daily?.precipitation_sum),
      windSpeedKmh: first(daily?.wind_speed_10m_max),
      windGustKmh: first(daily?.wind_gusts_10m_max),
      humidityPercent: clampPercent(data.current?.relative_humidity_2m ?? null),
      success: true,
    };
  } catch (err) {
    return { ...base, success: false, error: errorMessage(err) };
  }
}
