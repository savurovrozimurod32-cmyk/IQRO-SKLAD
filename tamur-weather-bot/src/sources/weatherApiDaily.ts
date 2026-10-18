import { z } from 'zod';
import { getEnv } from '../config/env.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage, logger } from '../utils/logger.js';
import { moonPhaseUz, to24h } from '../weather/astro.js';
import { fromWeatherApiCode } from '../weather/conditions.js';
import { clampPercent, isNum, round } from '../weather/normalize.js';
import type { DailySummary, ForecastDay, WeeklyForecast } from '../weather/types.js';
import { fetchJson } from './http.js';

const Cond = z.object({ code: z.number().nullable().optional() }).optional();

const Schema = z.object({
  current: z
    .object({
      temp_c: z.number().nullable().optional(),
      humidity: z.number().nullable().optional(),
      wind_kph: z.number().nullable().optional(),
      pressure_mb: z.number().nullable().optional(),
      condition: Cond,
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
                avghumidity: z.number().nullable().optional(),
                maxwind_kph: z.number().nullable().optional(),
                condition: Cond,
              })
              .optional(),
            astro: z
              .object({
                sunrise: z.string().optional(),
                sunset: z.string().optional(),
                moon_phase: z.string().optional(),
              })
              .optional(),
            hour: z
              .array(z.object({ time: z.string().optional(), temp_c: z.number().nullable().optional() }))
              .optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

const r0 = (v: number | null | undefined): number | null => (isNum(v) ? round(v as number, 0) : null);

/** hour[] massividan berilgan soatga eng yaqin temperaturani oladi. */
function tempAtHour(
  hours: Array<{ time?: string; temp_c?: number | null }> | undefined,
  target: number,
): number | null {
  if (!hours) return null;
  for (const h of hours) {
    const hh = Number((h.time ?? '').split(' ')[1]?.split(':')[0]);
    if (hh === target) return r0(h.temp_c);
  }
  return null;
}

/** WeatherAPI — bugungi kun xulosasi (astro + hour bilan). Kunlik karta primary manbasi. */
export async function fetchWeatherApiDaily(): Promise<DailySummary> {
  const env = getEnv();
  const date = zonedDateISO(env.WEATHER_TIMEZONE);
  const base: DailySummary = {
    date,
    condition: 'unknown',
    maxTempC: null,
    minTempC: null,
    humidityPercent: null,
    windKmh: null,
    pressureMb: null,
    moonPhaseUz: null,
    sunrise: null,
    sunset: null,
    morningTempC: null,
    dayTempC: null,
    eveningTempC: null,
    success: false,
  };

  if (!env.WEATHERAPI_KEY) {
    logger.warn('weatherapi', 'WEATHERAPI_KEY topilmadi — kunlik karta uchun fallback ishlatiladi.');
    return { ...base, error: 'WEATHERAPI_KEY sozlanmagan' };
  }

  try {
    const q = `${env.WEATHER_LAT},${env.WEATHER_LON}`;
    const url =
      `https://api.weatherapi.com/v1/forecast.json` +
      `?key=${encodeURIComponent(env.WEATHERAPI_KEY)}` +
      `&q=${encodeURIComponent(q)}&days=1&aqi=no&alerts=no`;

    const raw = await fetchJson<unknown>('weatherapi', url);
    const data = Schema.parse(raw);
    const fd = data.forecast?.forecastday?.[0];
    const day = fd?.day;
    const astro = fd?.astro;

    return {
      ...base,
      date: fd?.date ?? date,
      condition: fromWeatherApiCode(day?.condition?.code ?? data.current?.condition?.code ?? null),
      maxTempC: r0(day?.maxtemp_c),
      minTempC: r0(day?.mintemp_c),
      humidityPercent: clampPercent(data.current?.humidity ?? day?.avghumidity ?? null),
      windKmh: r0(day?.maxwind_kph ?? data.current?.wind_kph ?? null),
      pressureMb: r0(data.current?.pressure_mb),
      moonPhaseUz: moonPhaseUz(astro?.moon_phase),
      sunrise: to24h(astro?.sunrise),
      sunset: to24h(astro?.sunset),
      morningTempC: tempAtHour(fd?.hour, 7),
      dayTempC: tempAtHour(fd?.hour, 14),
      eveningTempC: tempAtHour(fd?.hour, 19),
      success: true,
    };
  } catch (err) {
    const msg = errorMessage(err);
    const hint = /401|403/.test(msg) ? ' (WEATHERAPI_KEY noto‘g‘ri yoki muddati tugagan)' : '';
    return { ...base, success: false, error: `${msg}${hint}` };
  }
}

// ── 10 kunlik fallback (WeatherAPI; bepul reja odatda 3 kun beradi) ──
const WeeklySchema = z.object({
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
                maxwind_kph: z.number().nullable().optional(),
                condition: Cond,
              })
              .optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export async function fetchWeatherApiWeekly(): Promise<WeeklyForecast> {
  const env = getEnv();
  if (!env.WEATHERAPI_KEY) return { days: [], success: false, error: 'WEATHERAPI_KEY sozlanmagan' };
  try {
    const q = `${env.WEATHER_LAT},${env.WEATHER_LON}`;
    const url =
      `https://api.weatherapi.com/v1/forecast.json` +
      `?key=${encodeURIComponent(env.WEATHERAPI_KEY)}` +
      `&q=${encodeURIComponent(q)}&days=10&aqi=no&alerts=no`;
    const raw = await fetchJson<unknown>('weatherapi', url);
    const list = WeeklySchema.parse(raw).forecast?.forecastday ?? [];
    const days: ForecastDay[] = list.slice(0, 10).map((fd) => {
      const rain = fd.day?.daily_chance_of_rain;
      const rainN = typeof rain === 'string' ? Number(rain) : rain;
      return {
        date: fd.date ?? '',
        condition: fromWeatherApiCode(fd.day?.condition?.code ?? null),
        maxTempC: r0(fd.day?.maxtemp_c),
        minTempC: r0(fd.day?.mintemp_c),
        precipitationProbability: clampPercent(isNum(rainN) ? (rainN as number) : null),
        windKmh: r0(fd.day?.maxwind_kph),
      };
    });
    if (days.length === 0) throw new Error('forecast bo‘sh');
    return { days, success: true };
  } catch (err) {
    return { days: [], success: false, error: errorMessage(err) };
  }
}
