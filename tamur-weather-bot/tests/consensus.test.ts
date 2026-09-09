import { describe, expect, it } from 'vitest';
import { computeConsensus, conditionConsensus } from '../src/weather/consensus.js';
import { median } from '../src/weather/normalize.js';
import type { WeatherCondition, WeatherSourceResult } from '../src/weather/types.js';

function src(over: Partial<WeatherSourceResult>): WeatherSourceResult {
  return {
    source: 'open-meteo',
    fetchedAt: '2026-09-09T00:00:00Z',
    forecastDate: '2026-09-09',
    currentTemperatureC: 30,
    minTemperatureC: 20,
    maxTemperatureC: 35,
    condition: 'clear',
    precipitationProbability: 0,
    precipitationMm: 0,
    windSpeedKmh: 10,
    windGustKmh: 20,
    humidityPercent: 40,
    success: true,
    ...over,
  };
}

const opts = { city: 'Buxoro', date: '2026-09-09', minSuccessfulSources: 2 };

describe('median (outlierlarga chidamli)', () => {
  it('35, 36, 44 => 36', () => {
    expect(median([35, 36, 44])).toBe(36);
  });
  it('null qiymatlarni chetlab o‘tadi', () => {
    expect(median([null, 36, 44, undefined])).toBe(40);
  });
});

describe('computeConsensus — sonli median', () => {
  it('temperatura 35,36,44 => 36', () => {
    const r = computeConsensus(
      [
        src({ source: 'open-meteo', currentTemperatureC: 35, maxTemperatureC: 35 }),
        src({ source: 'met-norway', currentTemperatureC: 36, maxTemperatureC: 36 }),
        src({ source: 'weatherapi', currentTemperatureC: 44, maxTemperatureC: 44 }),
      ],
      opts,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.final.currentTemperatureC).toBe(36);
      expect(r.final.maxTemperatureC).toBe(36);
    }
  });
});

describe('provider failure qoidalari', () => {
  it('bitta provider fail bo‘lsa, qolgan 2 bilan ishlaydi', () => {
    const r = computeConsensus(
      [
        src({ source: 'open-meteo' }),
        src({ source: 'met-norway' }),
        src({ source: 'weatherapi', success: false, error: 'timeout' }),
      ],
      opts,
    );
    expect(r.ok).toBe(true);
    expect(r.successCount).toBe(2);
  });

  it('faqat 1 provider qolsa — bloklanadi', () => {
    const r = computeConsensus(
      [
        src({ source: 'open-meteo' }),
        src({ source: 'met-norway', success: false, error: 'fail' }),
        src({ source: 'weatherapi', success: false, error: 'fail' }),
      ],
      opts,
    );
    expect(r.ok).toBe(false);
    expect(r.successCount).toBe(1);
  });
});

describe('condition consensus', () => {
  it('clear, clear, cloudy => clear', () => {
    const r = computeConsensus(
      [
        src({ source: 'open-meteo', condition: 'clear' }),
        src({ source: 'met-norway', condition: 'clear' }),
        src({ source: 'weatherapi', condition: 'cloudy' }),
      ],
      opts,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.final.condition).toBe('clear');
  });

  it('teng + quruq signal => yomg‘irni ortiqcha ko‘rsatmaydi', () => {
    const conds: WeatherCondition[] = ['clear', 'rain', 'cloudy'];
    // precip past (prob 10, mm 0) => quruq nomzod (cloudy) tanlanadi, rain emas
    expect(conditionConsensus(conds, 10, 0)).toBe('cloudy');
  });

  it('teng + ho‘l signal => eng jiddiy nomzod', () => {
    const conds: WeatherCondition[] = ['clear', 'rain', 'cloudy'];
    expect(conditionConsensus(conds, 80, 5)).toBe('rain');
  });
});

describe('null qiymatlar consensusni buzmaydi', () => {
  it('ba‘zi maydonlar null bo‘lsa ham ishlaydi', () => {
    const r = computeConsensus(
      [
        src({ source: 'open-meteo', windSpeedKmh: null, humidityPercent: null, precipitationProbability: null }),
        src({ source: 'met-norway', precipitationMm: null }),
      ],
      opts,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(typeof r.final.currentTemperatureC).toBe('number');
      expect(r.final.windSpeedKmh).not.toBeNaN();
    }
  });
});
