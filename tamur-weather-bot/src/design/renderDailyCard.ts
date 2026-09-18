import { WEEKEND_SALES, WEEKEND_SALES_NOTE, WEEKEND_SALES_TITLE, WEEKEND_STAFF_POLICY } from '../config/business.js';
import { formatUzDayMonth, zonedTimeHHMM } from '../utils/datetime.js';
import { uzLabel } from '../weather/conditions.js';
import { isNum } from '../weather/normalize.js';
import type { DailySummary } from '../weather/types.js';
import { weatherIconMarkup } from './icons.js';
import { backgroundLayer, rasterize, text } from './svg.js';
import { COLORS, backgroundFor } from './theme.js';

const W = 1080;
const H = 1340;

const tempStr = (v: number | null): string => (isNum(v) ? `${Math.round(v)}°` : '—');

export interface DailyRenderOptions {
  city: string;
  timezone: string;
  updatedAtLabel?: string;
}

function icon(cond: DailySummary['condition'], night: boolean, x: number, y: number, scale: number): string {
  return `<g transform="translate(${x}, ${y}) scale(${scale})">${weatherIconMarkup(cond, night)}</g>`;
}

/** Keng stat kartasi (Shamol / Bosim). */
function statCard(x: number, y: number, w: number, h: number, label: string, value: string): string {
  const cx = x + w / 2;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="${COLORS.cardFill}" stroke="${COLORS.cardStroke}" stroke-width="1.5" />
    ${text(cx, y + 48, label, { size: 24, weight: 600, fill: COLORS.copper, spacing: 1 })}
    ${text(cx, y + 98, value, { size: 42, weight: 700, fill: COLORS.cream })}`;
}

/** Tong/Kun/Oqshom kartasi. */
function partCard(
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  cond: DailySummary['condition'],
  night: boolean,
  tempC: number | null,
): string {
  const cx = x + w / 2;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="${COLORS.cardFill}" stroke="${COLORS.cardStroke}" stroke-width="1.5" />
    ${text(cx, y + 44, label, { size: 24, weight: 600, fill: COLORS.copper, spacing: 1 })}
    ${icon(cond, night, cx - 30, y + 56, 0.5)}
    ${text(cx, y + h - 28, tempStr(tempC), { size: 44, weight: 700, fill: COLORS.cream })}`;
}

/** Hafta oxiri savdo pilli (static biznes signali). */
function weekendPill(x: number, y: number, w: number, h: number, day: string, label: string, accent: string): string {
  const cx = x + w / 2;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-width="2" />
    ${text(cx, y + 44, day, { size: 24, weight: 600, fill: accent })}
    ${text(cx, y + 92, label, { size: 48, weight: 700, fill: accent })}`;
}

export function buildDailySvg(s: DailySummary, opts: DailyRenderOptions): string {
  const cx = W / 2;
  const bg = backgroundFor(s.condition);
  const sub = `Bugun, ${formatUzDayMonth(s.date)}`;
  const updated = opts.updatedAtLabel ?? zonedTimeHHMM(opts.timezone);

  const gap = 24;
  const contentW = 920;

  // Shamol + Bosim
  const statW = (contentW - gap) / 2;
  const statY = 594;
  const statH = 132;
  const stats = `
    ${statCard(80, statY, statW, statH, 'SHAMOL', isNum(s.windKmh) ? `${s.windKmh} km/soat` : '—')}
    ${statCard(80 + statW + gap, statY, statW, statH, 'BOSIM', isNum(s.pressureMb) ? `${s.pressureMb} mb` : '—')}`;

  // Tong / Kun / Oqshom
  const partW = (contentW - 2 * gap) / 3;
  const partY = 760;
  const partH = 196;
  const parts = `
    ${partCard(80, partY, partW, partH, 'Tong', s.condition, false, s.morningTempC)}
    ${partCard(80 + partW + gap, partY, partW, partH, 'Kun', s.condition, false, s.dayTempC)}
    ${partCard(80 + 2 * (partW + gap), partY, partW, partH, 'Oqshom', s.condition, true, s.eveningTempC)}`;

  // Hafta oxiri savdo indeksi (3 rangli pill)
  const pillW = (contentW - 2 * gap) / 3;
  const pillY = 1024;
  const pillH = 112;
  const pills = WEEKEND_SALES.map((s2, i) =>
    weekendPill(80 + i * (pillW + gap), pillY, pillW, pillH, s2.day, s2.label, s2.accent),
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${backgroundLayer(W, H, bg)}

  ${text(cx, 102, opts.city, { size: 58, weight: 700, fill: COLORS.cream, spacing: 1 })}
  ${text(cx, 150, sub, { size: 30, weight: 500, fill: COLORS.creamMuted })}

  ${icon(s.condition, false, cx - 98, 190, 1.6)}

  ${text(cx - 28, 466, tempStr(s.maxTempC), { size: 120, weight: 700, fill: COLORS.cream, anchor: 'end' })}
  ${text(cx + 20, 466, tempStr(s.minTempC), { size: 58, weight: 500, fill: COLORS.copperSoft, anchor: 'start' })}
  ${text(cx, 528, uzLabel(s.condition), { size: 42, weight: 500, fill: COLORS.copperSoft })}

  <line x1="80" y1="570" x2="1000" y2="570" stroke="${COLORS.cardStroke}" stroke-width="1.5" />
  ${stats}
  ${parts}

  ${text(cx, 998, WEEKEND_SALES_TITLE, { size: 26, weight: 600, fill: COLORS.copper, spacing: 1 })}
  ${pills}
  ${text(cx, 1176, WEEKEND_SALES_NOTE, { size: 22, weight: 500, fill: COLORS.creamFaint })}

  <rect x="80" y="1200" width="920" height="88" rx="22" fill="${COLORS.cardFill}" stroke="${COLORS.copper}" stroke-width="2" />
  ${text(cx, 1234, 'SHANBA VA YAKSHANBA — QAT’IY QOIDA', { size: 21, weight: 700, fill: COLORS.copper, spacing: 1 })}
  ${text(cx, 1268, WEEKEND_STAFF_POLICY, { size: 19, weight: 600, fill: COLORS.cream })}

  ${text(cx, 1318, `Yangilandi • ${updated}`, { size: 22, weight: 500, fill: COLORS.creamFaint, spacing: 1 })}
</svg>`;
}

export async function renderDailyCardPng(s: DailySummary, opts: DailyRenderOptions): Promise<Buffer> {
  return rasterize(buildDailySvg(s, opts), W, H);
}

export const DAILY_CANVAS = { width: W, height: H } as const;
