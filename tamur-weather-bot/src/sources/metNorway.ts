import { z } from 'zod';
import { getEnv } from '../config/env.js';
import { zonedDateISO, zonedParts } from '../utils/datetime.js';
import { errorMessage } from '../utils/logger.js';
import { fromMetSymbol, severity } from '../weather/conditions.js';
import {
  clampPercent,
  compact,
  isNum,
  maxOf,
  mean,
  minOf,
  round,
} from '../weather/normalize.js';
import type { WeatherCondition, WeatherSourceResult } from '../weather/types.js';
import { fetchJson } from './http.js';

const Details = z
  .object({
    air_temperature: z.number().nullable().optional(),
    relative_humidity: z.number().nullable().optional(),
    wind_speed: z.number().nullable().optional(),
    wind_speed_of_gust: z.number().nullable().optional(),
  })
  .optional();

const Schema = z.object({
  properties: z.object({
    timeseries: z.array(
      z.object({
        time: z.string(),
        data: z.object({
          instant: z.object({ details: Details }).optional(),
          next_1_hours: z
            .object({
              summary: z.object({ symbol_code: z.string().optional() }).optional(),
              details: z
                .object({
                  precipitation_amount: z.number().nullable().optional(),
                  probability_of_precipitation: z.number().nullable().optional(),
                })
                .optional(),
            })
            .optional(),
        }),
      }),
    ),
  }),
});

type Series = z.infer<typeof Schema>['properties']['timeseries'];

/** Kun entrylari orasidan ustun (dominant) canonical holatni topadi. */
function dominantCondition(conditions: WeatherCondition[]): WeatherCondition {
  if (conditions.length === 0) return 'unknown';
  const counts = new Map<WeatherCondition, number>();
  for (const c of conditions) {
    if (c === 'unknown') continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  if (counts.size === 0) return 'unknown';
  let best: WeatherCondition = 'unknown';
  let bestCount = -1;
  for (const [c, n] of counts) {
    if (n > bestCount || (n === bestCount && severity(c) > severity(best))) {
      best = c;
      bestCount = n;
    }
  }
  return best;
}

export async function fetchMetNorway(): Promise<WeatherSourceResult> {
  const env = getEnv();
  const fetchedAt = new Date().toISOString();
  const forecastDate = zonedDateISO(env.WEATHER_TIMEZONE);

  const base: WeatherSourceResult = {
    source: 'met-norway',
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
    // MET Norway koordinatalarda ko'pi bilan 4 kasrni tavsiya qiladi.
    const lat = round(env.WEATHER_LAT, 4);
    const lon = round(env.WEATHER_LON, 4);
    const url =
      `https://api.met.no/weatherapi/locationforecast/2.0/compact` +
      `?lat=${lat}&lon=${lon}`;

    const raw = await fetchJson<unknown>('met-norway', url, {
      'User-Agent': env.MET_USER_AGENT,
    });
    const data = Schema.parse(raw);
    const series: Series = data.properties.timeseries;

    // Bugungi (Asia/Tashkent) local kunga tegishli entrylarni ajratamiz.
    // MET vaqtlari UTC — har birini local sanaga o'giramiz.
    const todays = series.filter(
      (e) => zonedDateISO(env.WEATHER_TIMEZONE, new Date(e.time)) === forecastDate,
    );
    const used = todays.length > 0 ? todays : series.slice(0, 8);

    const temps: Array<number | null> = [];
    const humidity: Array<number | null> = [];
    const winds: Array<number | null> = [];
    const gusts: Array<number | null> = [];
    const precipAmounts: Array<number | null> = [];
    const precipProbs: Array<number | null> = [];
    const conditions: WeatherCondition[] = [];

    let closestTemp: number | null = null;
    let closestDiff = Number.POSITIVE_INFINITY;

    for (const e of used) {
      const inst = e.data.instant?.details;
      const next1 = e.data.next_1_hours;
      temps.push(inst?.air_temperature ?? null);
      humidity.push(inst?.relative_humidity ?? null);
      winds.push(inst?.wind_speed ?? null);
      gusts.push(inst?.wind_speed_of_gust ?? null);
      precipAmounts.push(next1?.details?.precipitation_amount ?? null);
      precipProbs.push(next1?.details?.probability_of_precipitation ?? null);
      if (next1?.summary?.symbol_code) {
        conditions.push(fromMetSymbol(next1.summary.symbol_code));
      }

      // 09:00 (local) ga eng yaqin temperatura
      if (isNum(inst?.air_temperature)) {
        const { hour } = zonedParts(env.WEATHER_TIMEZONE, new Date(e.time));
        const diff = Math.abs(hour - 9);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestTemp = inst!.air_temperature as number;
        }
      }
    }

    const precipSum = compact(precipAmounts);
    const windMs = maxOf(winds);
    const gustMs = maxOf(gusts);
    const humidityAvg = mean(humidity);

    return {
      ...base,
      currentTemperatureC: closestTemp,
      minTemperatureC: minOf(temps),
      maxTemperatureC: maxOf(temps),
      condition: dominantCondition(conditions),
      precipitationProbability: clampPercent(maxOf(precipProbs)),
      precipitationMm: precipSum.length > 0 ? round(precipSum.reduce((a, b) => a + b, 0), 1) : null,
      windSpeedKmh: isNum(windMs) ? round(windMs * 3.6, 1) : null,
      windGustKmh: isNum(gustMs) ? round(gustMs * 3.6, 1) : null,
      humidityPercent: clampPercent(humidityAvg),
      success: true,
    };
  } catch (err) {
    return { ...base, success: false, error: errorMessage(err) };
  }
}
