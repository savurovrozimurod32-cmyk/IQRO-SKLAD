import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { renderWeatherCardPng } from '../src/design/renderWeatherCard.js';
import { orderedSample, withFailures } from '../src/weather/sample.js';

const opts = { city: 'Buxoro', date: '2026-09-10', timezone: 'Asia/Tashkent', updatedAtLabel: '09:00' };

async function assertValidCard(png: Buffer): Promise<void> {
  expect(png.length).toBeGreaterThan(1000);
  expect(png.subarray(0, 4).toString('hex')).toBe('89504e47'); // PNG magic
  const meta = await sharp(png).metadata();
  expect(meta.format).toBe('png');
  expect(meta.width).toBe(1080);
  expect(meta.height).toBe(1350);
}

describe('3-manba PNG rendering', () => {
  it('3/3 — hamma manba ishlaydi', async () => {
    const png = await renderWeatherCardPng(orderedSample('Asia/Tashkent'), opts);
    await assertValidCard(png);
  });

  it('2/3 — bitta manba "Ma’lumot olinmadi"', async () => {
    const sources = withFailures(orderedSample('Asia/Tashkent'), ['weatherapi']);
    const png = await renderWeatherCardPng(sources, opts);
    await assertValidCard(png);
  });

  it('1/3 — ikkita manba failed, layout saqlanadi', async () => {
    const sources = withFailures(orderedSample('Asia/Tashkent'), ['met-norway', 'weatherapi']);
    const png = await renderWeatherCardPng(sources, opts);
    await assertValidCard(png);
  });
});
