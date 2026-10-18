import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { DAILY_CANVAS, renderDailyCardPng } from '../src/design/renderDailyCard.js';
import { WEEKLY_CANVAS, renderWeeklyCardPng } from '../src/design/renderWeeklyCard.js';
import { sampleDailySummary, sampleWeeklyForecast } from '../src/weather/forecastSample.js';
import { buildRecommendation } from '../src/weather/recommendation.js';

const TZ = 'Asia/Tashkent';

async function meta(png: Buffer) {
  expect(png.length).toBeGreaterThan(1000);
  expect(png.subarray(0, 4).toString('hex')).toBe('89504e47'); // PNG magic
  return sharp(png).metadata();
}

describe('daily-summary rendering', () => {
  it('1080×1200 valid PNG', async () => {
    const png = await renderDailyCardPng(sampleDailySummary(TZ), { city: 'Buxoro', timezone: TZ });
    const m = await meta(png);
    expect(m.format).toBe('png');
    expect(m.width).toBe(DAILY_CANVAS.width);
    expect(m.height).toBe(DAILY_CANVAS.height);
  });

  it('null qiymatlar bilan ham render bo‘ladi', async () => {
    const s = sampleDailySummary(TZ);
    const png = await renderDailyCardPng(
      { ...s, moonPhaseUz: null, pressureMb: null, sunrise: null, sunset: null, morningTempC: null },
      { city: 'Buxoro', timezone: TZ },
    );
    expect(png.length).toBeGreaterThan(1000);
  });
});

describe('weekly-forecast rendering', () => {
  it('1280×760 valid PNG + manager box', async () => {
    const weekly = sampleWeeklyForecast(TZ);
    const rec = buildRecommendation(weekly.days, TZ);
    const png = await renderWeeklyCardPng(weekly, rec, { timezone: TZ });
    const m = await meta(png);
    expect(m.format).toBe('png');
    expect(m.width).toBe(WEEKLY_CANVAS.width);
    expect(m.height).toBe(WEEKLY_CANVAS.height);
  });

  it('kam kun (fallback 3 kun) bo‘lsa ham render bo‘ladi', async () => {
    const weekly = sampleWeeklyForecast(TZ);
    const three = { ...weekly, days: weekly.days.slice(0, 3) };
    const png = await renderWeeklyCardPng(three, buildRecommendation(three.days, TZ), { timezone: TZ });
    expect(png.length).toBeGreaterThan(1000);
  });
});
