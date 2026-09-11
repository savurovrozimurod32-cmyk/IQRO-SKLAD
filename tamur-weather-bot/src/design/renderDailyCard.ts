import { formatUzDayMonth, zonedTimeHHMM } from '../utils/datetime.js';
import { uzLabel } from '../weather/conditions.js';
import { isNum } from '../weather/normalize.js';
import type { DailySummary } from '../weather/types.js';
import { weatherIconMarkup } from './icons.js';
import { backgroundLayer, rasterize, text } from './svg.js';
import { COLORS, backgroundFor } from './theme.js';

const W = 1080;
const H = 1080;

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
    ${text(cx, y + 50, label, { size: 24, weight: 600, fill: COLORS.copper, spacing: 1 })}
    ${text(cx, y + 100, value, { size: 42, weight: 700, fill: COLORS.cream })}`;
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
    ${text(cx, y + 46, label, { size: 24, weight: 600, fill: COLORS.copper, spacing: 1 })}
    ${icon(cond, night, cx - 33, y + 60, 0.55)}
    ${text(cx, y + h - 30, tempStr(tempC), { size: 46, weight: 700, fill: COLORS.cream })}`;
}

export function buildDailySvg(s: DailySummary, opts: DailyRenderOptions): string {
  const cx = W / 2;
  const bg = backgroundFor(s.condition);
  const sub = `Bugun, ${formatUzDayMonth(s.date)}`;
  const updated = opts.updatedAtLabel ?? zonedTimeHHMM(opts.timezone);

  const gap = 24;
  const contentW = 920;

  // Shamol + Bosim (2 keng karta)
  const statW = (contentW - gap) / 2;
  const statY = 600;
  const statH = 138;
  const stats = `
    ${statCard(80, statY, statW, statH, 'SHAMOL', isNum(s.windKmh) ? `${s.windKmh} km/soat` : '—')}
    ${statCard(80 + statW + gap, statY, statW, statH, 'BOSIM', isNum(s.pressureMb) ? `${s.pressureMb} mb` : '—')}`;

  // Tong / Kun / Oqshom (3 karta)
  const partW = (contentW - 2 * gap) / 3;
  const partY = 786;
  const partH = 212;
  const parts = `
    ${partCard(80, partY, partW, partH, 'Tong', s.condition, false, s.morningTempC)}
    ${partCard(80 + partW + gap, partY, partW, partH, 'Kun', s.condition, false, s.dayTempC)}
    ${partCard(80 + 2 * (partW + gap), partY, partW, partH, 'Oqshom', s.condition, true, s.eveningTempC)}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${backgroundLayer(W, H, bg)}

  ${text(cx, 108, opts.city, { size: 58, weight: 700, fill: COLORS.cream, spacing: 1 })}
  ${text(cx, 156, sub, { size: 30, weight: 500, fill: COLORS.creamMuted })}

  ${icon(s.condition, false, cx - 100, 196, 1.65)}

  ${text(cx - 28, 470, tempStr(s.maxTempC), { size: 124, weight: 700, fill: COLORS.cream, anchor: 'end' })}
  ${text(cx + 20, 470, tempStr(s.minTempC), { size: 60, weight: 500, fill: COLORS.copperSoft, anchor: 'start' })}
  ${text(cx, 534, uzLabel(s.condition), { size: 42, weight: 500, fill: COLORS.copperSoft })}

  <line x1="80" y1="576" x2="1000" y2="576" stroke="${COLORS.cardStroke}" stroke-width="1.5" />
  ${stats}
  ${parts}

  ${text(cx, 1044, `Yangilandi • ${updated}`, { size: 24, weight: 500, fill: COLORS.creamFaint, spacing: 1 })}
</svg>`;
}

export async function renderDailyCardPng(s: DailySummary, opts: DailyRenderOptions): Promise<Buffer> {
  return rasterize(buildDailySvg(s, opts), W, H);
}

export const DAILY_CANVAS = { width: W, height: H } as const;
