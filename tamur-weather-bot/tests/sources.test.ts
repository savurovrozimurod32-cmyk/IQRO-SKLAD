import { describe, expect, it } from 'vitest';
import { successCount, shouldSend } from '../src/sources/index.js';
import { orderedSample, withFailures } from '../src/weather/sample.js';

const TZ = 'Asia/Tashkent';

describe('manba failure qoidalari (consensus YO‘Q)', () => {
  it('3/3 -> yuboriladi', () => {
    const s = orderedSample(TZ);
    expect(successCount(s)).toBe(3);
    expect(shouldSend(s)).toBe(true);
  });

  it('2/3 -> yuboriladi (bitta failed karta bo‘ladi)', () => {
    const s = withFailures(orderedSample(TZ), ['weatherapi']);
    expect(successCount(s)).toBe(2);
    expect(shouldSend(s)).toBe(true);
  });

  it('1/3 -> yuboriladi (ikkita failed karta)', () => {
    const s = withFailures(orderedSample(TZ), ['met-norway', 'weatherapi']);
    expect(successCount(s)).toBe(1);
    expect(shouldSend(s)).toBe(true);
  });

  it('0/3 -> yuborilmaydi (bloklanadi)', () => {
    const s = withFailures(orderedSample(TZ), ['open-meteo', 'met-norway', 'weatherapi']);
    expect(successCount(s)).toBe(0);
    expect(shouldSend(s)).toBe(false);
  });

  it('kartalar doimo SOURCE_ORDER tartibida', () => {
    const s = orderedSample(TZ);
    expect(s.map((x) => x.source)).toEqual(['open-meteo', 'met-norway', 'weatherapi']);
  });
});
