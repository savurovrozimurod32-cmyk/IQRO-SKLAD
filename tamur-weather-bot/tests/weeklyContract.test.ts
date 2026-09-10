import { describe, expect, it } from 'vitest';
import { isFullWeeklyForecast } from '../src/sources/index.js';
import type { ForecastDay, WeeklyForecast } from '../src/weather/types.js';

const day = (i: number): ForecastDay => ({
  date: `2026-09-${String(10 + i).padStart(2, '0')}`,
  condition: 'clear',
  maxTempC: 30,
  minTempC: 20,
  precipitationProbability: 0,
  windKmh: 10,
});

const forecast = (count: number): WeeklyForecast => ({
  success: true,
  days: Array.from({ length: count }, (_, i) => day(i)),
});

describe('10 kunlik output contract', () => {
  it('10 kunni qabul qiladi', () => {
    expect(isFullWeeklyForecast(forecast(10))).toBe(true);
  });

  it('3 kunlik fallbackni 10 kunlik deb qabul qilmaydi', () => {
    expect(isFullWeeklyForecast(forecast(3))).toBe(false);
  });

  it('success=false bo‘lsa 10 kun bo‘lsa ham qabul qilmaydi', () => {
    expect(isFullWeeklyForecast({ ...forecast(10), success: false })).toBe(false);
  });
});
