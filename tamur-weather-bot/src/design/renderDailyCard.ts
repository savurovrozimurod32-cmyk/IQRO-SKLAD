import { formatUzDayMonth, zonedTimeHHMM } from '../utils/datetime.js';
import { uzLabel } from '../weather/conditions.js';
import { isNum } from '../weather/normalize.js';
import type { DailySummary } from '../weather/types.js';
import { weatherIconMarkup } from './icons.js';
import { backgroundLayer, rasterize, text } from './svg.js';
import { COLORS, backgroundFor } from './theme.js';

const W = 1080;
const H = 1200;

const tempStr = (v: number | null): string => (isNum(v) ? `${Math.round(v)}°` : '—');

export interface DailyRenderOptions {
  city: string;
  timezone: string;
  updatedAtLabel?: string;
}

function icon(cond: DailySummary['condition'], night: boolean, x: number, y: number, scale: number): string {
  return `<g transform="translate(${x}, ${y}) scale(${scale})">${weatherIconMarkup(cond, night)}</g>`;
}

/** Kichik stat (label + value). */
function stat(cx: number, y: number, label: string, value: string): string {
  return `${text(cx, y, label, { size: 22, weight: 600, fill: COLORS.copper, spacing: 1 })}${text(cx, y + 40, value, { size: 34, weight: 600, fill: COLORS.cream })}`;
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
    ${icon(cond, night, cx - 33, y + 58, 0.55)}
    ${text(cx, y + h - 30, tempStr(tempC), { size: 46, weight: 700, fill: COLORS.cream })}`;
}

export function buildDailySvg(s: DailySummary, opts: DailyRenderOptions): string {
  const cx = W / 2;
  const bg = backgroundFor(s.condition);
  const sub = `Bugun, ${formatUzDayMonth(s.date)}`;
  const updated = opts.updatedAtLabel ?? zonedTimeHHMM(opts.timezone);

  // Katta harorat bloki: kunduzgi (katta) + tungi (kichik)
  const dayT = tempStr(s.maxTempC);
  const nightT = tempStr(s.minTempC);

  // Stat qatorlari (3 ustun × 2 qator)
  const c1 = 80 + 920 / 6;
  const c2 = cx;
  const c3 = 1000 - 920 / 6;
  const stats = `
    ${stat(c1, 640, 'NAMLIK', isNum(s.humidityPercent) ? `${s.humidityPercent}%` : '—')}
    ${stat(c2, 640, 'SHAMOL', isNum(s.windKmh) ? `${s.windKmh} km/soat` : '—')}
    ${stat(c3, 640, 'BOSIM', isNum(s.pressureMb) ? `${s.pressureMb} mb` : '—')}
    ${stat(c1, 748, 'OY FAZASI', s.moonPhaseUz ?? '—')}
    ${stat(c2, 748, 'QUYOSH CHIQISHI', s.sunrise ?? '—')}
    ${stat(c3, 748, 'QUYOSH BOTISHI', s.sunset ?? '—')}`;

  // Tong / Kun / Oqshom
  const gap = 24;
  const cardW = (920 - 2 * gap) / 3;
  const cardY = 870;
  const cardH = 210;
  const parts = `
    ${partCard(80, cardY, cardW, cardH, 'Tong', s.condition, false, s.morningTempC)}
    ${partCard(80 + cardW + gap, cardY, cardW, cardH, 'Kun', s.condition, false, s.dayTempC)}
    ${partCard(80 + 2 * (cardW + gap), cardY, cardW, cardH, 'Oqshom', s.condition, true, s.eveningTempC)}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${backgroundLayer(W, H, bg)}

  ${text(cx, 110, opts.city, { size: 58, weight: 700, fill: COLORS.cream, spacing: 1 })}
  ${text(cx, 158, sub, { size: 30, weight: 500, fill: COLORS.creamMuted })}

  ${icon(s.condition, false, cx - 96, 196, 1.6)}

  ${text(cx - 28, 486, dayT, { size: 118, weight: 700, fill: COLORS.cream, anchor: 'end' })}
  ${text(cx + 20, 486, nightT, { size: 58, weight: 500, fill: COLORS.copperSoft, anchor: 'start' })}
  ${text(cx, 548, uzLabel(s.condition), { size: 40, weight: 500, fill: COLORS.copperSoft })}

  <line x1="80" y1="590" x2="1000" y2="590" stroke="${COLORS.cardStroke}" stroke-width="1.5" />
  ${stats}
  <line x1="80" y1="820" x2="1000" y2="820" stroke="${COLORS.cardStroke}" stroke-width="1.5" />
  ${parts}

  ${text(cx, 1150, `Yangilandi • ${updated}`, { size: 24, weight: 500, fill: COLORS.creamFaint, spacing: 1 })}
</svg>`;
}

export async function renderDailyCardPng(s: DailySummary, opts: DailyRenderOptions): Promise<Buffer> {
  return rasterize(buildDailySvg(s, opts), W, H);
}

export const DAILY_CANVAS = { width: W, height: H } as const;
