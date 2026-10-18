import { describe, expect, it } from 'vitest';
import { WEEKEND_SALES, WEEKEND_SALES_TITLE, WEEKEND_STAFF_POLICY, colorForPercent, PERCENT_COLORS } from '../src/config/business.js';
import { buildDailySvg } from '../src/design/renderDailyCard.js';
import { buildWeeklySvg } from '../src/design/renderWeeklyCard.js';
import { dayDotMonth } from '../src/utils/datetime.js';
import { sampleDailySummary, sampleWeeklyForecast } from '../src/weather/forecastSample.js';
import { buildRecommendation } from '../src/weather/recommendation.js';

const TZ = 'Asia/Tashkent';

describe('daily card cleanup contract (daily — endi yuborilmaydi, lekin toza)', () => {
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

describe('weekly card: hafta oxiri savdo indeksi (static biznes signali)', () => {
  const weekly = sampleWeeklyForecast(TZ);
  const svg = buildWeeklySvg(weekly, buildRecommendation(weekly.days, TZ), { timezone: TZ });

  it('static qiymatlar: Juma +30%, Shanba +50%, Yakshanba +80%', () => {
    expect(WEEKEND_SALES.map((w) => [w.day, w.percent])).toEqual([
      ['Juma', 30],
      ['Shanba', 50],
      ['Yakshanba', 80],
    ]);
  });

  it('10-kunlik rasmda blok bor (sarlavha + 3 kun + foizlar)', () => {
    expect(svg).toContain(WEEKEND_SALES_TITLE);
    expect(svg).toContain('Past savdo kunlariga nisbatan');
    for (const w of WEEKEND_SALES) {
      expect(svg).toContain(w.day);
      expect(svg).toContain(w.label); // +30% / +50% / +80%
    }
  });

  it('Shanba/Yakshanba qat’iy xodim qoidasi ko‘rinadi', () => {
    expect(svg).toContain(WEEKEND_STAFF_POLICY);
    expect(WEEKEND_STAFF_POLICY).toContain('ob-havodan qat’i nazar');
    expect(WEEKEND_STAFF_POLICY).toContain('javob berilmaydi');
  });
});

describe('foizdan kelib chiqib rang (yuqori=yashil, past=qizil)', () => {
  const weekly = sampleWeeklyForecast(TZ);
  const svg = buildWeeklySvg(weekly, buildRecommendation(weekly.days, TZ), { timezone: TZ });

  it('bucketlar to‘g‘ri', () => {
    expect(colorForPercent(80)).toBe(PERCENT_COLORS.green);
    expect(colorForPercent(50)).toBe(PERCENT_COLORS.yellow);
    expect(colorForPercent(30)).toBe(PERCENT_COLORS.red);
    expect(colorForPercent(40)).toBe(PERCENT_COLORS.flame);
    expect(colorForPercent(10)).toBe(PERCENT_COLORS.darkRed);
  });

  it('pasaygan sari yashildan uzoqlashadi (monotonik tartib)', () => {
    const order = [
      PERCENT_COLORS.green,
      PERCENT_COLORS.yellow,
      PERCENT_COLORS.flame,
      PERCENT_COLORS.red,
      PERCENT_COLORS.darkRed,
    ];
    const seq = [90, 60, 40, 30, 5].map(colorForPercent);
    expect(seq).toEqual(order);
  });

  it('haftalik rasmda pill ranglari foizga mos (80=yashil, 50=sariq, 30=qizil)', () => {
    expect(svg).toContain(PERCENT_COLORS.green); // Yakshanba +80%
    expect(svg).toContain(PERCENT_COLORS.yellow); // Shanba +50%
    expect(svg).toContain(PERCENT_COLORS.red); // Juma +30%
  });
});

describe('weekly card: sarlavha va sanalar', () => {
  const weekly = sampleWeeklyForecast(TZ);
  const svg = buildWeeklySvg(weekly, buildRecommendation(weekly.days, TZ), { timezone: TZ });

  it('"bashorat" so‘zi ishlatilmaydi, "KUTILAYOTGAN OB-HAVO" bor', () => {
    expect(svg.toLowerCase()).not.toContain('bashorat');
    expect(svg).toContain('KUTILAYOTGAN OB-HAVO');
  });

  it('hafta kunlari ostida SANA (DD.MM) ko‘rinadi', () => {
    // 1-kundan boshlab (indeks 1) har kun sanasi DD.MM formatida chiqadi
    for (const d of weekly.days.slice(1)) {
      expect(svg).toContain(dayDotMonth(d.date));
    }
  });
});
