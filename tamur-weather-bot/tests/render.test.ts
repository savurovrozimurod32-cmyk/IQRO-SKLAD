import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { renderWeatherCardPng } from '../src/design/renderWeatherCard.js';
import { sampleFinal } from '../src/weather/sample.js';

describe('PNG rendering', () => {
  it('1080×1350 valid PNG, buffer bo‘sh emas', async () => {
    const png = await renderWeatherCardPng(sampleFinal('Asia/Tashkent'), {
      timezone: 'Asia/Tashkent',
      updatedAtLabel: '09:00',
    });

    expect(png.length).toBeGreaterThan(1000);
    // PNG magic bytes
    expect(png.subarray(0, 4).toString('hex')).toBe('89504e47');

    const meta = await sharp(png).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1350);
  });

  it('yomg‘irli holat ham render bo‘ladi', async () => {
    const base = sampleFinal('Asia/Tashkent');
    const png = await renderWeatherCardPng(
      { ...base, condition: 'rain', summaryUz: 'Bugun yomg‘ir kutilmoqda.' },
      { timezone: 'Asia/Tashkent' },
    );
    expect(png.length).toBeGreaterThan(1000);
  });
});
