import { z } from 'zod';
import { getEnv } from '../config/env.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage } from '../utils/logger.js';
import { to24h } from '../weather/astro.js';
import { fromOpenMeteoCode } from '../weather/conditions.js';
import { clampPercent, isNum, round } from '../weather/normalize.js';
import type { DailySummary, ForecastDay, WeeklyForecast } from '../weather/types.js';
import { fetchJson } from './http.js';

const r0 = (v: number | null | undefined): number | null => (isNum(v) ? round(v as number, 0) : null);

// ── 10 kunlik ──
const WeeklySchema = z.object({
  daily: z
    .object({
      time: z.array(z.string()).optional(),
      weather_code: z.array(z.number().nullable()).optional(),
      temperature_2m_max: z.array(z.number().nullable()).optional(),
      temperature_2m_min: z.array(z.number().nullable()).optional(),
      precipitation_probability_max: z.array(z.number().nullable()).optional(),
      wind_speed_10m_max: z.array(z.number().nullable()).optional(),
    })
    .optional(),
});

export async function fetchOpenMeteoWeekly(): Promise<WeeklyForecast> {
  const env = getEnv();
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${env.WEATHER_LAT}&longitude=${env.WEATHER_LON}` +
      `&timezone=${encodeURIComponent(env.WEATHER_TIMEZONE)}` +
      `&forecast_days=10&wind_speed_unit=kmh` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,` +
      `precipitation_probability_max,wind_speed_10m_max`;

    const raw = await fetchJson<unknown>('open-meteo', url);
    const d = WeeklySchema.parse(raw).daily;
    const times = d?.time ?? [];

    const days: ForecastDay[] = times.slice(0, 10).map((date, i) => ({
      date,
      condition: fromOpenMeteoCode(d?.weather_code?.[i] ?? null),
      maxTempC: r0(d?.temperature_2m_max?.[i]),
      minTempC: r0(d?.temperature_2m_min?.[i]),
      precipitationProbability: clampPercent(d?.precipitation_probability_max?.[i] ?? null),
      windKmh: r0(d?.wind_speed_10m_max?.[i]),
    }));

    if (days.length === 0) throw new Error('kunlik forecast bo‘sh');
    return { days, success: true };
  } catch (err) {
    return { days: [], success: false, error: errorMessage(err) };
  }
}

// ── Kunlik xulosa (fallback, WeatherAPI ishlamasa) ──
const DailySchema = z.object({
  current: z
    .object({
      temperature_2m: z.number().nullable().optional(),
      relative_humidity_2m: z.number().nullable().optional(),
      weather_code: z.number().nullable().optional(),
      surface_pressure: z.number().nullable().optional(),
      wind_speed_10m: z.number().nullable().optional(),
    })
    .optional(),
  daily: z
    .object({
      time: z.array(z.string()).optional(),
      weather_code: z.array(z.number().nullable()).optional(),
      temperature_2m_max: z.array(z.number().nullable()).optional(),
      temperature_2m_min: z.array(z.number().nullable()).optional(),
      sunrise: z.array(z.string()).optional(),
      sunset: z.array(z.string()).optional(),
    })
    .optional(),
  hourly: z
    .object({
      time: z.array(z.string()).optional(),
      temperature_2m: z.array(z.number().nullable()).optional(),
    })
    .optional(),
});

function hourlyTempAt(
  hourly: { time?: string[]; temperature_2m?: Array<number | null> } | undefined,
  date: string,
  target: number,
): number | null {
  const times = hourly?.time ?? [];
  for (let i = 0; i < times.length; i++) {
    const t = times[i] as string;
    if (!t.startsWith(date)) continue;
    const hh = Number(t.split('T')[1]?.split(':')[0]);
    if (hh === target) return r0(hourly?.temperature_2m?.[i]);
  }
  return null;
}

export async function fetchOpenMeteoDaily(): Promise<DailySummary> {
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
    moonPhaseUz: null, // Open-Meteo oy fazasini bermaydi
    sunrise: null,
    sunset: null,
    morningTempC: null,
    dayTempC: null,
    eveningTempC: null,
    success: false,
  };

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${env.WEATHER_LAT}&longitude=${env.WEATHER_LON}` +
      `&timezone=${encodeURIComponent(env.WEATHER_TIMEZONE)}` +
      `&forecast_days=1&wind_speed_unit=kmh` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
      `&hourly=temperature_2m`;

    const raw = await fetchJson<unknown>('open-meteo', url);
    const data = DailySchema.parse(raw);
    const d = data.daily;
    const forecastDate = d?.time?.[0] ?? date;

    return {
      ...base,
      date: forecastDate,
      condition: fromOpenMeteoCode(d?.weather_code?.[0] ?? data.current?.weather_code ?? null),
      maxTempC: r0(d?.temperature_2m_max?.[0]),
      minTempC: r0(d?.temperature_2m_min?.[0]),
      humidityPercent: clampPercent(data.current?.relative_humidity_2m ?? null),
      windKmh: r0(data.current?.wind_speed_10m),
      pressureMb: r0(data.current?.surface_pressure),
      sunrise: to24h(d?.sunrise?.[0]),
      sunset: to24h(d?.sunset?.[0]),
      morningTempC: hourlyTempAt(data.hourly, forecastDate, 7),
      dayTempC: hourlyTempAt(data.hourly, forecastDate, 14),
      eveningTempC: hourlyTempAt(data.hourly, forecastDate, 19),
      success: true,
    };
  } catch (err) {
    return { ...base, success: false, error: errorMessage(err) };
  }
}
