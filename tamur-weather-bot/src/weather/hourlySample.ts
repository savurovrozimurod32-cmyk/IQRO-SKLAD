import { zonedDateISO } from '../utils/datetime.js';
import { hourlyHours } from './hourly.js';
import {
  HOURLY_SOURCE_ORDER,
  type HourlyForecastPoint,
  type HourlySourceId,
  type HourlySourceResult,
  type WeatherCondition,
} from './types.js';

/** Soatga qarab namunaviy condition (ertalab ochiq, tushda bulut, kechqurun tiniq). */
function sampleCondition(hour: number): WeatherCondition {
  if (hour >= 16 && hour <= 18) return 'rain';
  if (hour >= 12 && hour <= 15) return 'partly_cloudy';
  if (hour >= 19) return 'clear'; // kechqurun -> kechasi ikonkasi
  return 'clear';
}

function sampleTemp(hour: number, offset: number): number {
  // 09:00 ~22°, 15:00 ~37°, 23:00 ~26° atrofida egri chiziq
  const peak = 37;
  const base = peak - Math.abs(hour - 15) * 1.4;
  return Math.round(base + offset);
}

function samplePoints(offset: number): HourlyForecastPoint[] {
  return hourlyHours().map((hour) => {
    const cond = sampleCondition(hour);
    const rain = cond === 'rain' ? 70 : cond === 'partly_cloudy' ? 15 : 0;
    return {
      time: `${String(hour).padStart(2, '0')}:00`,
      temperatureC: sampleTemp(hour, offset),
      condition: cond,
      precipitationProbability: rain,
      windSpeedKmh: 6 + (hour % 5) + offset,
    };
  });
}

/** Preview/test uchun 2 manba (open-meteo, weatherapi) namunaviy soatbay data. */
export function sampleHourlySources(timezone: string): HourlySourceResult[] {
  const date = zonedDateISO(timezone);
  return [
    { source: 'open-meteo', date, hourly: samplePoints(0), success: true },
    { source: 'weatherapi', date, hourly: samplePoints(1), success: true },
  ];
}

/** Har doim HOURLY_SOURCE_ORDER tartibida. */
export function orderedHourlySample(timezone: string): HourlySourceResult[] {
  const byId = new Map(sampleHourlySources(timezone).map((s) => [s.source, s]));
  return HOURLY_SOURCE_ORDER.map((id) => byId.get(id)).filter(
    (s): s is HourlySourceResult => Boolean(s),
  );
}

/** Ko'rsatilgan manbalarni "muvaffaqiyatsiz" qiladi (failure preview/test). */
export function withHourlyFailures(
  sources: HourlySourceResult[],
  failed: HourlySourceId[],
): HourlySourceResult[] {
  return sources.map((s) =>
    failed.includes(s.source)
      ? { ...s, success: false, hourly: [], error: 'namuna: ma’lumot olinmadi' }
      : s,
  );
}
