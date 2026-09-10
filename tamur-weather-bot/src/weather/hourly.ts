import { isNum, maxOf, minOf } from './normalize.js';
import {
  HOURLY_END_HOUR,
  HOURLY_START_HOUR,
  type HourlyForecastPoint,
} from './types.js';

/** 09:00 dan 23:00 gacha soatlar ro'yxati (15 ta). */
export function hourlyHours(): number[] {
  const out: number[] = [];
  for (let h = HOURLY_START_HOUR; h <= HOURLY_END_HOUR; h++) out.push(h);
  return out;
}

/** "HH:mm" (yoki "H:mm") dan soatni ajratadi. */
export function hourFromLabel(time: string): number {
  const hh = time.trim().split(':')[0] ?? '';
  return Number(hh);
}

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/** Soat -> nuqta indeksi (rasmda qatorlarni tekislash uchun). */
export function indexByHour(points: HourlyForecastPoint[]): Map<number, HourlyForecastPoint> {
  const m = new Map<number, HourlyForecastPoint>();
  for (const p of points) m.set(hourFromLabel(p.time), p);
  return m;
}

/** Faqat 09:00–23:00 oralig'idagi nuqtalarni, soat bo'yicha tartiblab qaytaradi. */
export function selectDayWindow(points: HourlyForecastPoint[]): HourlyForecastPoint[] {
  return points
    .filter((p) => {
      const h = hourFromLabel(p.time);
      return h >= HOURLY_START_HOUR && h <= HOURLY_END_HOUR;
    })
    .sort((a, b) => hourFromLabel(a.time) - hourFromLabel(b.time));
}

/** Soatbay temperaturalardan kunlik min/max (rasm tepasidagi kichik summary). */
export function dailyRange(points: HourlyForecastPoint[]): { minC: number | null; maxC: number | null } {
  const temps = points.map((p) => p.temperatureC);
  return { minC: minOf(temps), maxC: maxOf(temps) };
}

/** Kechasi ikonkasi kerakmi (soat bo'yicha oddiy heuristika). */
export function isNightHour(hour: number): boolean {
  return hour >= 19 || hour < 6;
}

export { isNum };
