import { describe, expect, it } from 'vitest';
import { WEEKEND_SALES, WEEKEND_SALES_TITLE, WEEKEND_STAFF_POLICY } from '../src/config/business.js';
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

describe('hafta oxiri savdo indeksi (static biznes signali)', () => {
  const svg = buildDailySvg(sampleDailySummary(TZ), { city: 'Buxoro', timezone: TZ });

  it('static qiymatlar: Juma +30%, Shanba +50%, Yakshanba +80%', () => {
    expect(WEEKEND_SALES.map((w) => [w.day, w.percent])).toEqual([
      ['Juma', 30],
      ['Shanba', 50],
      ['Yakshanba', 80],
    ]);
  });

  it('daily cardda blok bor (sarlavha + 3 kun + foizlar)', () => {
    expect(svg).toContain(WEEKEND_SALES_TITLE);
    expect(svg).toContain('Past savdo kunlariga nisbatan');
    for (const w of WEEKEND_SALES) {
      expect(svg).toContain(w.day);
      expect(svg).toContain(w.label);
    }
  });

  it('daily cardda Shanba/Yakshanba qat’iy xodim qoidasi ko‘rinadi', () => {
    expect(svg).toContain('SHANBA VA YAKSHANBA — QAT’IY QOIDA');
    expect(svg).toContain(WEEKEND_STAFF_POLICY);
    expect(WEEKEND_STAFF_POLICY).toContain('ob-havodan qat’i nazar');
    expect(WEEKEND_STAFF_POLICY).toContain('javob berilmaydi');
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
