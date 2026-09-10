import { zonedDateISO } from '../utils/datetime.js';
import type { DailySummary, ForecastDay, WeatherCondition, WeeklyForecast } from './types.js';

/** "YYYY-MM-DD" ga n kun qo'shadi (sana matni bilan xavfsiz). */
export function addDays(dateISO: string, n: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function sampleDailySummary(timezone: string): DailySummary {
  return {
    date: zonedDateISO(timezone),
    condition: 'partly_cloudy',
    maxTempC: 37,
    minTempC: 23,
    humidityPercent: 34,
    windKmh: 12,
    pressureMb: 1012,
    moonPhaseUz: 'Yosh oy',
    sunrise: '06:12',
    sunset: '18:45',
    morningTempC: 29,
    dayTempC: 36,
    eveningTempC: 33,
    success: true,
  };
}

const CYCLE: WeatherCondition[] = [
  'clear',
  'clear',
  'partly_cloudy',
  'partly_cloudy',
  'rain',
  'cloudy',
  'clear',
  'partly_cloudy',
  'thunderstorm',
  'clear',
];

export function sampleWeeklyForecast(timezone: string): WeeklyForecast {
  const today = zonedDateISO(timezone);
  const days: ForecastDay[] = Array.from({ length: 10 }, (_, i) => {
    const condition = CYCLE[i] ?? 'clear';
    const wet = condition === 'rain' || condition === 'thunderstorm';
    return {
      date: addDays(today, i),
      condition,
      maxTempC: 38 - i - (wet ? 6 : 0),
      minTempC: 24 - Math.floor(i / 2) - (wet ? 3 : 0),
      precipitationProbability: wet ? 70 : condition === 'cloudy' ? 30 : 5,
      windKmh: 8 + (i % 4) * 3 + (wet ? 18 : 0),
    };
  });
  return { days, success: true };
}
