import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { HOURLY_CANVAS, renderHourlyCardPng } from '../src/design/renderHourlyCard.js';
import { orderedHourlySample, withHourlyFailures } from '../src/weather/hourlySample.js';

const opts = { city: 'Buxoro', date: '2026-09-10', timezone: 'Asia/Tashkent', updatedAtLabel: '09:00' };

async function assertValid(png: Buffer): Promise<void> {
  expect(png.length).toBeGreaterThan(1000);
  expect(png.subarray(0, 4).toString('hex')).toBe('89504e47'); // PNG magic
  const meta = await sharp(png).metadata();
  expect(meta.format).toBe('png');
  expect(meta.width).toBe(HOURLY_CANVAS.width); // 1080
  expect(meta.height).toBe(HOURLY_CANVAS.height); // 2400 (uzun format)
}

describe('soatbay jadval PNG rendering', () => {
  it('2/2 — ikkala ustun real data', async () => {
    const png = await renderHourlyCardPng(orderedHourlySample('Asia/Tashkent'), opts);
    await assertValid(png);
  });

  it('1/2 — bitta ustun "Ma’lumot olinmadi", layout saqlanadi', async () => {
    const sources = withHourlyFailures(orderedHourlySample('Asia/Tashkent'), ['weatherapi']);
    const png = await renderHourlyCardPng(sources, opts);
    await assertValid(png);
  });

  it('uzun format 1080×2400', () => {
    expect(HOURLY_CANVAS).toEqual({ width: 1080, height: 2400 });
  });
});
