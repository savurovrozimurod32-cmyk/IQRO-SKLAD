import { describe, expect, it } from 'vitest';
import { successCount, shouldSend } from '../src/sources/index.js';
import {
  dailyRange,
  hourFromLabel,
  hourlyHours,
  indexByHour,
  isNightHour,
  selectDayWindow,
} from '../src/weather/hourly.js';
import {
  orderedHourlySample,
  sampleHourlySources,
  withHourlyFailures,
} from '../src/weather/hourlySample.js';
import type { HourlyForecastPoint } from '../src/weather/types.js';

const TZ = 'Asia/Tashkent';

describe('soatbay oyna 09:00–23:00 = 15 soat', () => {
  it('hourlyHours 15 ta soat qaytaradi', () => {
    expect(hourlyHours()).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]);
  });

  it('sample har manbada 15 nuqta beradi', () => {
    for (const s of sampleHourlySources(TZ)) {
      expect(s.hourly).toHaveLength(15);
      expect(s.hourly[0]?.time).toBe('09:00');
      expect(s.hourly[14]?.time).toBe('23:00');
    }
  });

  it('selectDayWindow 09:00 dan oldin/keyin nuqtalarni chetlab o‘tadi', () => {
    const pts: HourlyForecastPoint[] = [
      { time: '06:00', temperatureC: 15, condition: 'clear', precipitationProbability: 0, windSpeedKmh: 5 },
      { time: '09:00', temperatureC: 22, condition: 'clear', precipitationProbability: 0, windSpeedKmh: 6 },
      { time: '23:00', temperatureC: 26, condition: 'clear', precipitationProbability: 0, windSpeedKmh: 7 },
      { time: '00:00', temperatureC: 24, condition: 'clear', precipitationProbability: 0, windSpeedKmh: 5 },
    ];
    const win = selectDayWindow(pts);
    expect(win.map((p) => p.time)).toEqual(['09:00', '23:00']);
  });
});

describe('yordamchilar', () => {
  it('hourFromLabel', () => {
    expect(hourFromLabel('09:00')).toBe(9);
    expect(hourFromLabel('23:00')).toBe(23);
  });
  it('isNightHour — kechqurun/kechasi', () => {
    expect(isNightHour(9)).toBe(false);
    expect(isNightHour(15)).toBe(false);
    expect(isNightHour(19)).toBe(true);
    expect(isNightHour(23)).toBe(true);
  });
  it('indexByHour soat bo‘yicha topadi', () => {
    const s = sampleHourlySources(TZ)[0]!;
    const idx = indexByHour(s.hourly);
    expect(idx.get(15)?.time).toBe('15:00');
    expect(idx.has(8)).toBe(false);
  });
  it('dailyRange min/max', () => {
    const pts: HourlyForecastPoint[] = [
      { time: '09:00', temperatureC: 22, condition: 'clear', precipitationProbability: 0, windSpeedKmh: 5 },
      { time: '15:00', temperatureC: 37, condition: 'clear', precipitationProbability: 0, windSpeedKmh: 8 },
      { time: '23:00', temperatureC: 26, condition: 'clear', precipitationProbability: 0, windSpeedKmh: 6 },
    ];
    expect(dailyRange(pts)).toEqual({ minC: 22, maxC: 37 });
  });
});

describe('failure qoidalari (0/2 bloklanadi)', () => {
  it('2/2 -> yuboriladi', () => {
    const s = orderedHourlySample(TZ);
    expect(successCount(s)).toBe(2);
    expect(shouldSend(s)).toBe(true);
    expect(s.map((x) => x.source)).toEqual(['open-meteo', 'weatherapi']);
  });
  it('1/2 -> yuboriladi (ikkinchi ustun "Ma’lumot olinmadi")', () => {
    const s = withHourlyFailures(orderedHourlySample(TZ), ['weatherapi']);
    expect(successCount(s)).toBe(1);
    expect(shouldSend(s)).toBe(true);
  });
  it('0/2 -> yuborilmaydi', () => {
    const s = withHourlyFailures(orderedHourlySample(TZ), ['open-meteo', 'weatherapi']);
    expect(successCount(s)).toBe(0);
    expect(shouldSend(s)).toBe(false);
  });
});
