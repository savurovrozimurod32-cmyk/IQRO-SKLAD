import { z } from 'zod';
import { getEnv } from '../config/env.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage, logger } from '../utils/logger.js';
import { fromWeatherApiCode } from '../weather/conditions.js';
import { hourFromLabel, selectDayWindow } from '../weather/hourly.js';
import { clampPercent, isNum, round } from '../weather/normalize.js';
import type { HourlyForecastPoint, HourlySourceResult } from '../weather/types.js';
import { fetchJson } from './http.js';

const HourSchema = z.object({
  time: z.string().optional(),
  temp_c: z.number().nullable().optional(),
  condition: z.object({ code: z.number().nullable().optional() }).optional(),
  chance_of_rain: z.union([z.number(), z.string()]).nullable().optional(),
  wind_kph: z.number().nullable().optional(),
});

const Schema = z.object({
  forecast: z
    .object({
      forecastday: z
        .array(z.object({ date: z.string().optional(), hour: z.array(HourSchema).optional() }))
        .optional(),
    })
    .optional(),
});

const toNum = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'string' ? Number(v) : v;
  return isNum(n) ? n : null;
};

/**
 * WeatherAPI.com — bugungi SOATBAY prognoz, 09:00–23:00.
 * Merge/consensus yo'q — o'z ustunida ko'rsatiladi.
 */
export async function fetchWeatherApiHourly(): Promise<HourlySourceResult> {
  const env = getEnv();
  const date = zonedDateISO(env.WEATHER_TIMEZONE);
  const base: HourlySourceResult = { source: 'weatherapi', date, hourly: [], success: false };

  if (!env.WEATHERAPI_KEY) {
    logger.warn('weatherapi', 'WEATHERAPI_KEY topilmadi — bu manba o‘tkazib yuborildi (.env ni to‘ldiring).');
    return { ...base, error: 'WEATHERAPI_KEY sozlanmagan' };
  }

  try {
    const q = `${env.WEATHER_LAT},${env.WEATHER_LON}`;
    const url =
      `https://api.weatherapi.com/v1/forecast.json` +
      `?key=${encodeURIComponent(env.WEATHERAPI_KEY)}` +
      `&q=${encodeURIComponent(q)}&days=1&aqi=no&alerts=no`;

    const raw = await fetchJson<unknown>('weatherapi', url);
    const day = Schema.parse(raw).forecast?.forecastday?.[0];
    const hours = day?.hour ?? [];

    const points: HourlyForecastPoint[] = [];
    for (const hr of hours) {
      // WeatherAPI format: "YYYY-MM-DD HH:mm" (lokatsiya vaqti = Asia/Tashkent)
      const tp = (hr.time ?? '').split(' ')[1] ?? '';
      const hh = hourFromLabel(tp);
      points.push({
        time: `${String(hh).padStart(2, '0')}:00`,
        temperatureC: isNum(hr.temp_c) ? round(hr.temp_c as number, 0) : null,
        condition: fromWeatherApiCode(hr.condition?.code ?? null),
        precipitationProbability: clampPercent(toNum(hr.chance_of_rain)),
        windSpeedKmh: isNum(hr.wind_kph) ? round(hr.wind_kph as number, 0) : null,
      });
    }

    const hourly = selectDayWindow(points);
    if (hourly.length === 0) throw new Error('soatbay ma’lumot bo‘sh');
    return { ...base, date: day?.date ?? date, hourly, success: true };
  } catch (err) {
    const msg = errorMessage(err);
    const hint = /401|403/.test(msg) ? ' (WEATHERAPI_KEY noto‘g‘ri yoki muddati tugagan)' : '';
    return { ...base, success: false, error: `${msg}${hint}` };
  }
}
