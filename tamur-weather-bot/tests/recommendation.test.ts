import { describe, expect, it } from 'vitest';
import { buildRecommendation, scoreDay } from '../src/weather/recommendation.js';
import type { ForecastDay } from '../src/weather/types.js';

const TZ = 'Asia/Tashkent';

function day(date: string, over: Partial<ForecastDay>): ForecastDay {
  return {
    date,
    condition: 'clear',
    maxTempC: 30,
    minTempC: 20,
    precipitationProbability: 0,
    windKmh: 8,
    ...over,
  };
}

describe('scoreDay — savdo qulayligi', () => {
  it('ochiq + mo‘tadil harorat yuqori ball', () => {
    const good = scoreDay(day('2026-09-10', { condition: 'clear', maxTempC: 30 }));
    const bad = scoreDay(day('2026-09-10', { condition: 'thunderstorm', maxTempC: 20, precipitationProbability: 80, windKmh: 45 }));
    expect(good).toBeGreaterThan(bad);
  });

  it('yomg‘ir va kuchli shamol ballni pasaytiradi', () => {
    const dry = scoreDay(day('2026-09-10', { condition: 'clear', precipitationProbability: 0, windKmh: 5 }));
    const wet = scoreDay(day('2026-09-10', { condition: 'clear', precipitationProbability: 70, windKmh: 42 }));
    expect(wet).toBeLessThan(dry);
  });

  it('juda issiq (39+) minus', () => {
    const hot = scoreDay(day('2026-09-10', { condition: 'clear', maxTempC: 41 }));
    const mild = scoreDay(day('2026-09-10', { condition: 'clear', maxTempC: 30 }));
    expect(hot).toBeLessThan(mild);
  });
});

describe('buildRecommendation', () => {
  const days: ForecastDay[] = [
    day('2026-09-10', { condition: 'rain', maxTempC: 22, precipitationProbability: 80, windKmh: 40 }), // sust
    day('2026-09-11', { condition: 'clear', maxTempC: 30 }), // juda qulay
    day('2026-09-12', { condition: 'cloudy', maxTempC: 33, precipitationProbability: 30 }),
  ];

  it('eng qulay kunni tanlaydi va matn beradi', () => {
    const rec = buildRecommendation(days, TZ);
    expect(rec).not.toBeNull();
    expect(rec!.bestDate).toBe('2026-09-11');
    expect(rec!.lines[0]).toContain('savdo');
    expect(rec!.lines.length).toBeGreaterThanOrEqual(1);
  });

  it('juda qulay kun -> "hech kimga javob berilmaydi"', () => {
    const rec = buildRecommendation(days, TZ)!;
    expect(rec.lines[0]).toContain('hech kimga javob berilmaydi');
  });

  it('bo‘sh ro‘yxat -> null', () => {
    expect(buildRecommendation([], TZ)).toBeNull();
  });
});

describe('cloudy = salqin/sust (final lock qoidasi)', () => {
  it('bir xil haroratda: clear > partly_cloudy > cloudy', () => {
    const clear = scoreDay(day('2026-09-10', { condition: 'clear', maxTempC: 30 }));
    const partly = scoreDay(day('2026-09-10', { condition: 'partly_cloudy', maxTempC: 30 }));
    const cloudy = scoreDay(day('2026-09-10', { condition: 'cloudy', maxTempC: 30 }));
    expect(clear).toBeGreaterThan(partly);
    expect(partly).toBeGreaterThan(cloudy);
  });

  it('cloudy kun condition hissasi manfiy (quyosh yo‘q -> salqin)', () => {
    // Bir xil haroratdagi clear va cloudy farqi >= 4 (4 -> -1)
    const clear = scoreDay(day('2026-09-10', { condition: 'clear', maxTempC: 30 }));
    const cloudy = scoreDay(day('2026-09-10', { condition: 'cloudy', maxTempC: 30 }));
    expect(clear - cloudy).toBeGreaterThanOrEqual(4);
  });

  it('aralash kunlarda cloudy kun eng qulay deb tanlanmaydi', () => {
    const days: ForecastDay[] = [
      day('2026-09-10', { condition: 'cloudy', maxTempC: 30 }),
      day('2026-09-11', { condition: 'clear', maxTempC: 30 }),
    ];
    const rec = buildRecommendation(days, TZ)!;
    expect(rec.bestDate).toBe('2026-09-11'); // clear kun
  });

  it('butun hafta cloudy bo‘lsa "qulay kun / hech kimga javob berilmaydi" chiqmaydi', () => {
    const days: ForecastDay[] = [
      day('2026-09-10', { condition: 'cloudy', maxTempC: 28 }),
      day('2026-09-11', { condition: 'cloudy', maxTempC: 27 }),
    ];
    const rec = buildRecommendation(days, TZ)!;
    expect(rec.lines[0]).not.toContain('hech kimga javob berilmaydi');
  });
});
