import { z } from 'zod';
import { getEnv } from '../config/env.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage } from '../utils/logger.js';
import { fromOpenMeteoCode } from '../weather/conditions.js';
import { hourFromLabel, selectDayWindow } from '../weather/hourly.js';
import { clampPercent, isNum, round } from '../weather/normalize.js';
import type { HourlyForecastPoint, HourlySourceResult } from '../weather/types.js';
import { fetchJson } from './http.js';

const Schema = z.object({
  hourly: z
    .object({
      time: z.array(z.string()).optional(),
      temperature_2m: z.array(z.number().nullable()).optional(),
      weather_code: z.array(z.number().nullable()).optional(),
      precipitation_probability: z.array(z.number().nullable()).optional(),
      wind_speed_10m: z.array(z.number().nullable()).optional(),
    })
    .optional(),
});

/**
 * Open-Meteo — bugungi (Asia/Tashkent) SOATBAY prognoz, 09:00–23:00.
 * Merge/consensus yo'q — o'z ustunida ko'rsatiladi.
 */
export async function fetchOpenMeteoHourly(): Promise<HourlySourceResult> {
  const env = getEnv();
  const date = zonedDateISO(env.WEATHER_TIMEZONE);
  const base: HourlySourceResult = { source: 'open-meteo', date, hourly: [], success: false };

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${env.WEATHER_LAT}&longitude=${env.WEATHER_LON}` +
      `&timezone=${encodeURIComponent(env.WEATHER_TIMEZONE)}` +
      `&forecast_days=1&wind_speed_unit=kmh` +
      `&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m`;

    const raw = await fetchJson<unknown>('open-meteo', url);
    const h = Schema.parse(raw).hourly;
    const times = h?.time ?? [];

    const points: HourlyForecastPoint[] = [];
    for (let i = 0; i < times.length; i++) {
      const t = times[i] as string;
      // Open-Meteo timezone=local, format "YYYY-MM-DDTHH:00"
      if (!t.startsWith(date)) continue; // faqat bugungi kun
      const tp = t.split('T')[1] ?? '';
      const hh = hourFromLabel(tp);
      const temp = h?.temperature_2m?.[i];
      const code = h?.weather_code?.[i];
      points.push({
        time: `${String(hh).padStart(2, '0')}:00`,
        temperatureC: isNum(temp) ? round(temp as number, 0) : null,
        condition: fromOpenMeteoCode(code ?? null),
        precipitationProbability: clampPercent(h?.precipitation_probability?.[i] ?? null),
        windSpeedKmh: isNum(h?.wind_speed_10m?.[i]) ? round(h!.wind_speed_10m![i] as number, 0) : null,
      });
    }

    const hourly = selectDayWindow(points);
    if (hourly.length === 0) throw new Error('soatbay ma’lumot bo‘sh');
    return { ...base, hourly, success: true };
  } catch (err) {
    return { ...base, success: false, error: errorMessage(err) };
  }
}
