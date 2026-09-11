import { describe, expect, it } from 'vitest';
import { buildDailySvg } from '../src/design/renderDailyCard.js';
import { buildWeeklySvg } from '../src/design/renderWeeklyCard.js';
import { sampleDailySummary, sampleWeeklyForecast } from '../src/weather/forecastSample.js';
import { buildRecommendation } from '../src/weather/recommendation.js';

const TZ = 'Asia/Tashkent';

describe('daily card cleanup contract', () => {
  const svg = buildDailySvg(sampleDailySummary(TZ), { city: 'Buxoro', timezone: TZ });

  it('namlik / oy fazasi / quyosh chiqishi-botishi YO‘Q', () => {
    expect(svg).not.toContain('NAMLIK');
    expect(svg).not.toContain('OY FAZASI');
    expect(svg).not.toContain('QUYOSH');
  });

  it('shamol, bosim va Tong/Kun/Oqshom QOLADI', () => {
    expect(svg).toContain('SHAMOL');
    expect(svg).toContain('BOSIM');
    expect(svg).toContain('Tong');
    expect(svg).toContain('Kun');
    expect(svg).toContain('Oqshom');
  });
});

describe('weekly title rename contract', () => {
  const weekly = sampleWeeklyForecast(TZ);
  const svg = buildWeeklySvg(weekly, buildRecommendation(weekly.days, TZ), { timezone: TZ });

  it('"bashorat" so‘zi ishlatilmaydi', () => {
    expect(svg.toLowerCase()).not.toContain('bashorat');
  });

  it('"KUTILAYOTGAN OB-HAVO" sarlavhasi bor', () => {
    expect(svg).toContain('KUTILAYOTGAN OB-HAVO');
  });
});
