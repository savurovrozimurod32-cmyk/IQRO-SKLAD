import { describe, expect, it } from 'vitest';
import { moonPhaseUz, to24h } from '../src/weather/astro.js';
import { addDays, sampleDailySummary, sampleWeeklyForecast } from '../src/weather/forecastSample.js';
import { weekdayShortUz } from '../src/utils/datetime.js';

const TZ = 'Asia/Tashkent';

describe('astro — oy fazasi va vaqt', () => {
  it('moon phase inglizcha -> o‘zbekcha', () => {
    expect(moonPhaseUz('Full Moon')).toBe('To‘linoy');
    expect(moonPhaseUz('New Moon')).toBe('Yangi oy');
    expect(moonPhaseUz(null)).toBeNull();
  });
  it('to24h — AM/PM va ISO', () => {
    expect(to24h('06:12 AM')).toBe('06:12');
    expect(to24h('07:30 PM')).toBe('19:30');
    expect(to24h('12:00 AM')).toBe('00:00');
    expect(to24h('12:00 PM')).toBe('12:00');
    expect(to24h('2026-09-10T06:05')).toBe('06:05');
    expect(to24h(null)).toBeNull();
  });
});

describe('sample data', () => {
  it('kunlik xulosada tong/kun/oqshom bor', () => {
    const s = sampleDailySummary(TZ);
    expect(s.morningTempC).not.toBeNull();
    expect(s.dayTempC).not.toBeNull();
    expect(s.eveningTempC).not.toBeNull();
    expect(s.sunrise).toMatch(/^\d{2}:\d{2}$/);
  });

  it('10 kunlik — 10 kun, ketma-ket sanalar', () => {
    const w = sampleWeeklyForecast(TZ);
    expect(w.days).toHaveLength(10);
    for (let i = 1; i < w.days.length; i++) {
      expect(w.days[i]!.date).toBe(addDays(w.days[0]!.date, i));
    }
  });

  it('addDays oy chegarasidan o‘tadi', () => {
    expect(addDays('2026-09-29', 3)).toBe('2026-10-02');
  });

  it('weekdayShortUz Uzbek qisqa kun beradi', () => {
    // 2026-09-10 = Payshanba -> Pa
    expect(weekdayShortUz('2026-09-10', TZ)).toBe('Pa');
  });
});
