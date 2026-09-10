import { zonedDateISO } from '../utils/datetime.js';
import { SOURCE_ORDER } from './types.js';
import type { WeatherCondition, WeatherSourceId, WeatherSourceResult } from './types.js';

/**
 * Preview/test uchun namunaviy 3 manba natijasi (real API kerak emas).
 * Har manba biroz farqli — 3 alohida karta ko'rinishini sinash uchun.
 */
export function sampleSources(timezone: string): WeatherSourceResult[] {
  const date = zonedDateISO(timezone);
  const now = new Date().toISOString();
  const mk = (
    source: WeatherSourceId,
    over: Partial<WeatherSourceResult>,
  ): WeatherSourceResult => ({
    source,
    fetchedAt: now,
    forecastDate: date,
    currentTemperatureC: 34,
    minTemperatureC: 20,
    maxTemperatureC: 36,
    condition: 'clear',
    precipitationProbability: 5,
    precipitationMm: 0,
    windSpeedKmh: 12,
    windGustKmh: 22,
    humidityPercent: 34,
    success: true,
    ...over,
  });
  return [
    mk('open-meteo', { currentTemperatureC: 35, maxTemperatureC: 36, humidityPercent: 32 }),
    mk('met-norway', {
      currentTemperatureC: 34,
      maxTemperatureC: 37,
      condition: 'partly_cloudy',
      precipitationProbability: 15,
      windSpeedKmh: 18,
      humidityPercent: 38,
    }),
    mk('weatherapi', {
      currentTemperatureC: 36,
      maxTemperatureC: 35,
      minTemperatureC: 21,
      precipitationProbability: 8,
      windSpeedKmh: 10,
      humidityPercent: 30,
    }),
  ];
}

/** Xohlagan manbalarni "muvaffaqiyatsiz" qilib belgilaydi (failure preview). */
export function withFailures(
  sources: WeatherSourceResult[],
  failed: WeatherSourceId[],
): WeatherSourceResult[] {
  return sources.map((s) =>
    failed.includes(s.source)
      ? {
          ...s,
          success: false,
          error: 'namuna: ma’lumot olinmadi',
          condition: 'unknown' as WeatherCondition,
          currentTemperatureC: null,
          minTemperatureC: null,
          maxTemperatureC: null,
          precipitationProbability: null,
          precipitationMm: null,
          windSpeedKmh: null,
          windGustKmh: null,
          humidityPercent: null,
        }
      : s,
  );
}

/** Har doim SOURCE_ORDER tartibida (rasm kartalari tartibi). */
export function orderedSample(timezone: string): WeatherSourceResult[] {
  const byId = new Map(sampleSources(timezone).map((s) => [s.source, s]));
  return SOURCE_ORDER.map((id) => byId.get(id)).filter((s): s is WeatherSourceResult => Boolean(s));
}
