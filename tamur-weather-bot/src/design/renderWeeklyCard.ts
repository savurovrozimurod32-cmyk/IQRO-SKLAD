import { WEEKEND_SALES, WEEKEND_SALES_NOTE, WEEKEND_SALES_TITLE, WEEKEND_STAFF_POLICY } from '../config/business.js';
import { dayDotMonth, weekdayShortUz, zonedTimeHHMM } from '../utils/datetime.js';
import { isNum } from '../weather/normalize.js';
import type { Recommendation } from '../weather/recommendation.js';
import type { WeeklyForecast } from '../weather/types.js';
import { weatherIconMarkup } from './icons.js';
import { backgroundLayer, rasterize, text } from './svg.js';
import { COLORS, backgroundFor } from './theme.js';

const W = 1280;
const H = 980;
const MARGIN = 40;

const tempStr = (v: number | null): string => (isNum(v) ? `${Math.round(v)}°` : '—');

/** Matnni taxminiy kenglik bo'yicha satrlarga bo'ladi (Poppins ~0.5em/belgi). */
function wrap(input: string, maxWidth: number, fontSize: number): string[] {
  const maxChars = Math.max(10, Math.floor(maxWidth / (fontSize * 0.5)));
  const words = input.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (cand.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = cand;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Hafta oxiri savdo pilli (static biznes signali). */
function weekendPill(x: number, y: number, w: number, h: number, day: string, label: string, accent: string): string {
  const cx = x + w / 2;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-width="2" />
    ${text(cx, y + 44, day, { size: 26, weight: 600, fill: accent })}
    ${text(cx, y + 92, label, { size: 50, weight: 700, fill: accent })}`;
}

export interface WeeklyRenderOptions {
  timezone: string;
  updatedAtLabel?: string;
}

export function buildWeeklySvg(
  weekly: WeeklyForecast,
  rec: Recommendation | null,
  opts: WeeklyRenderOptions,
): string {
  const cx = W / 2;
  const days = weekly.days.slice(0, 10);
  const n = Math.max(days.length, 1);
  const bg = backgroundFor(days[0]?.condition ?? 'unknown');
  const updated = opts.updatedAtLabel ?? zonedTimeHHMM(opts.timezone);

  const colW = (W - 2 * MARGIN) / n;
  const colCenter = (i: number): number => MARGIN + colW * (i + 0.5);

  // Grafik chegaralari (harorat -> y)
  const yTop = 190;
  const yBottom = 320;
  const maxes = days.map((d) => d.maxTempC).filter(isNum) as number[];
  const mins = days.map((d) => d.minTempC).filter(isNum) as number[];
  const all = [...maxes, ...mins];
  const tHi = all.length ? Math.max(...all) : 40;
  const tLo = all.length ? Math.min(...all) : 0;
  const span = tHi - tLo || 1;
  const yOf = (t: number): number => yBottom - ((t - tLo) / span) * (yBottom - yTop);

  const maxPts: string[] = [];
  const minPts: string[] = [];
  let dots = '';
  days.forEach((d, i) => {
    const x = colCenter(i);
    if (isNum(d.maxTempC)) {
      const y = yOf(d.maxTempC);
      maxPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${COLORS.copper}" />`;
    }
    if (isNum(d.minTempC)) {
      const y = yOf(d.minTempC);
      minPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${COLORS.creamMuted}" />`;
    }
  });
  const maxLine = maxPts.length > 1 ? `<polyline points="${maxPts.join(' ')}" fill="none" stroke="${COLORS.copper}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" />` : '';
  const minLine = minPts.length > 1 ? `<polyline points="${minPts.join(' ')}" fill="none" stroke="${COLORS.creamMuted}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="2 6" />` : '';

  // Ustunlar (hafta kuni + SANA + ikon + temp)
  let cols = '';
  days.forEach((d, i) => {
    const x = colCenter(i);
    const wd = i === 0 ? 'Bugun' : weekdayShortUz(d.date, opts.timezone);
    cols += `
      ${text(x, 110, wd, { size: i === 0 ? 22 : 24, weight: 600, fill: i === 0 ? COLORS.copper : COLORS.cream })}
      ${text(x, 140, dayDotMonth(d.date), { size: 20, weight: 500, fill: COLORS.creamMuted })}
      <g transform="translate(${x - 26}, 346) scale(0.44)">${weatherIconMarkup(d.condition, false)}</g>
      ${text(x, 426, tempStr(d.maxTempC), { size: 30, weight: 700, fill: COLORS.cream })}
      ${text(x, 460, tempStr(d.minTempC), { size: 24, weight: 500, fill: COLORS.creamMuted })}`;
  });

  // Hafta oxiri savdo indeksi (3 rangli pill)
  const gap = 24;
  const contentW = W - 2 * MARGIN;
  const pillW = (contentW - 2 * gap) / 3;
  const pillY = 548;
  const pillH = 112;
  const pills = WEEKEND_SALES.map((s, i) =>
    weekendPill(MARGIN + i * (pillW + gap), pillY, pillW, pillH, s.day, s.label, s.accent),
  ).join('');

  // Menejer tavsiyasi boksi (ichida hafta oxiri siyosati + ob-havo tavsiyasi)
  const boxX = MARGIN;
  const boxY = 716;
  const boxW = contentW;
  const boxH = 240;
  const policyLines = wrap(WEEKEND_STAFF_POLICY, boxW - 72, 24);
  const recSource = rec?.lines ?? ['Tavsiya uchun ma’lumot yetarli emas.'];
  const recLines = recSource.flatMap((line) => wrap(line, boxW - 72, 26)).slice(0, 2);

  let bodyY = boxY + 92;
  let body = '';
  for (const line of policyLines.slice(0, 2)) {
    body += text(boxX + 36, bodyY, line, { size: 24, weight: 600, fill: COLORS.copperSoft, anchor: 'start' });
    bodyY += 38;
  }
  bodyY += 6;
  for (const line of recLines) {
    body += text(boxX + 36, bodyY, line, { size: 26, weight: 500, fill: COLORS.cream, anchor: 'start' });
    bodyY += 40;
  }
  const box = `
    <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="28" fill="${COLORS.cardFill}" stroke="${COLORS.copper}" stroke-width="2" />
    ${text(boxX + 36, boxY + 50, 'MENEJER TAVSIYASI', { size: 24, weight: 700, fill: COLORS.copper, spacing: 2, anchor: 'start' })}
    ${body}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${backgroundLayer(W, H, bg)}

  ${text(cx, 60, '10 KUNLIK KUTILAYOTGAN OB-HAVO', { size: 32, weight: 700, fill: COLORS.copper, spacing: 2 })}
  ${text(W - MARGIN, 40, `Yangilandi • ${updated}`, { size: 20, weight: 500, fill: COLORS.creamFaint, anchor: 'end' })}

  ${maxLine}
  ${minLine}
  ${dots}
  ${cols}

  <line x1="${MARGIN}" y1="500" x2="${W - MARGIN}" y2="500" stroke="${COLORS.cardStroke}" stroke-width="1.5" />
  ${text(cx, 536, WEEKEND_SALES_TITLE, { size: 26, weight: 600, fill: COLORS.copper, spacing: 1 })}
  ${pills}
  ${text(cx, 692, WEEKEND_SALES_NOTE, { size: 22, weight: 500, fill: COLORS.creamFaint })}
  ${box}
</svg>`;
}

export async function renderWeeklyCardPng(
  weekly: WeeklyForecast,
  rec: Recommendation | null,
  opts: WeeklyRenderOptions,
): Promise<Buffer> {
  return rasterize(buildWeeklySvg(weekly, rec, opts), W, H);
}

export const WEEKLY_CANVAS = { width: W, height: H } as const;
