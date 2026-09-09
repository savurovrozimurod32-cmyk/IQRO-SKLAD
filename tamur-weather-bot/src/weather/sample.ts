import { zonedDateISO } from '../utils/datetime.js';
import { buildSummaryUz } from './summary.js';
import type { FinalWeather, WeatherSourceResult } from './types.js';

/** Preview/test uchun namunaviy manba natijalari (real API kerak emas). */
export function sampleSources(timezone: string): WeatherSourceResult[] {
  const date = zonedDateISO(timezone);
  const now = new Date().toISOString();
  const mk = (
    source: WeatherSourceResult['source'],
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
    mk('open-meteo', { currentTemperatureC: 35, maxTemperatureC: 36 }),
    mk('met-norway', { currentTemperatureC: 34, maxTemperatureC: 37, condition: 'partly_cloudy' }),
    mk('weatherapi', { currentTemperatureC: 36, maxTemperatureC: 35 }),
  ];
}

/** To'g'ridan-to'g'ri namunaviy FinalWeather (render smoke-test uchun). */
export function sampleFinal(timezone: string): FinalWeather {
  const date = zonedDateISO(timezone);
  const condition = 'clear' as const;
  const maxTemperatureC = 36;
  return {
    city: 'Buxoro',
    date,
    currentTemperatureC: 35,
    minTemperatureC: 20,
    maxTemperatureC,
    condition,
    precipitationProbability: 5,
    precipitationMm: 0,
    windSpeedKmh: 12,
    windGustKmh: 22,
    humidityPercent: 34,
    summaryUz: buildSummaryUz({
      condition,
      maxTemperatureC,
      precipitationProbability: 5,
      windSpeedKmh: 12,
    }),
    sourceCount: 3,
    generatedAt: new Date().toISOString(),
  };
}
