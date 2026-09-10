import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { formatUzDate, zonedTimeHHMM } from '../utils/datetime.js';
import {
  dailyRange,
  hourFromLabel,
  hourlyHours,
  indexByHour,
  isNightHour,
} from '../weather/hourly.js';
import { isNum } from '../weather/normalize.js';
import { SOURCE_DISPLAY_NAME } from '../weather/types.js';
import type { HourlyForecastPoint, HourlySourceResult } from '../weather/types.js';
import { weatherIconMarkup } from './icons.js';
import { COLORS, FONT_FAMILY, backgroundFor } from './theme.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FONT_DIR = resolve(HERE, '../../assets/fonts');
const FONT_FILES = [
  'Poppins-Regular.ttf',
  'Poppins-Medium.ttf',
  'Poppins-SemiBold.ttf',
  'Poppins-Bold.ttf',
].map((f) => resolve(FONT_DIR, f));

function ensureFonts(): void {
  for (const p of FONT_FILES) {
    if (!existsSync(p)) throw new Error(`Font topilmadi: ${p} (assets/fonts to'liq emas)`);
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface TextOpts {
  size: number;
  weight?: number;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
  spacing?: number;
  opacity?: number;
}
function text(x: number, y: number, content: string, o: TextOpts): string {
  const { size, weight = 400, fill = COLORS.cream, anchor = 'middle', spacing = 0, opacity = 1 } = o;
  return `<text x="${x}" y="${y}" font-family="${FONT_FAMILY}" font-size="${size}" font-weight="${weight}" fill="${fill}" fill-opacity="${opacity}" text-anchor="${anchor}" letter-spacing="${spacing}">${escapeXml(content)}</text>`;
}

// ── O'lchamlar (uzun format) ──
const W = 1080;
const H = 2400;
const MARGIN = 40;
const TIME_X = MARGIN; // 40
const TIME_W = 128;
const GAP = 16;
const COL_W = (W - 2 * MARGIN - TIME_W - GAP) / 2; // 428
const COL1_X = TIME_X + TIME_W; // 168
const COL2_X = COL1_X + COL_W + GAP; // 612
const timeCenter = TIME_X + TIME_W / 2;
const col1Center = COL1_X + COL_W / 2;
const col2Center = COL2_X + COL_W / 2;

const ROWS_TOP = 430;
const FOOTER_Y = 2360;
const ROW_H = (FOOTER_Y - 30 - ROWS_TOP) / 15; // ~126.7

const tempStr = (v: number | null): string => (isNum(v) ? `${Math.round(v)}°` : '—');

function rangeStr(points: HourlyForecastPoint[]): string {
  const { minC, maxC } = dailyRange(points);
  if (!isNum(minC) || !isNum(maxC)) return '—';
  return `${Math.round(minC)}° – ${Math.round(maxC)}°`;
}

function subLine(p: HourlyForecastPoint): string {
  const rain = isNum(p.precipitationProbability) ? `Yomg‘ir ${p.precipitationProbability}%` : null;
  const wind = isNum(p.windSpeedKmh) ? `Shamol ${Math.round(p.windSpeedKmh)} km/soat` : null;
  const parts = [rain, wind].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(' • ') : '—';
}

/** Bitta katak (soat × manba). */
function cell(p: HourlyForecastPoint | undefined, colX: number, rowTop: number, hour: number): string {
  const cx = colX + COL_W / 2;
  if (!p) {
    return text(cx, rowTop + ROW_H / 2 + 8, '—', { size: 30, weight: 500, fill: COLORS.creamFaint });
  }
  const night = isNightHour(hour);
  const iconSize = 44;
  const scale = iconSize / 120;
  const iconX = colX + 18;
  const iconY = rowTop + ROW_H / 2 - iconSize / 2;
  const textX = iconX + iconSize + 16;
  return `
    <g transform="translate(${iconX}, ${iconY}) scale(${scale.toFixed(3)})">${weatherIconMarkup(p.condition, night)}</g>
    ${text(textX, rowTop + ROW_H / 2 - 4, tempStr(p.temperatureC), { size: 40, weight: 700, fill: COLORS.cream, anchor: 'start' })}
    ${text(textX, rowTop + ROW_H / 2 + 30, subLine(p), { size: 20, weight: 500, fill: COLORS.creamMuted, anchor: 'start' })}`;
}

export interface HourlyRenderOptions {
  city: string;
  date: string; // "YYYY-MM-DD"
  timezone: string;
  updatedAtLabel?: string;
}

export function buildHourlySvg(sources: HourlySourceResult[], opts: HourlyRenderOptions): string {
  const cx = W / 2;
  const dateLabel = formatUzDate(opts.date, opts.timezone);
  const updated = opts.updatedAtLabel ?? zonedTimeHHMM(opts.timezone);

  const om = sources.find((s) => s.source === 'open-meteo');
  const wa = sources.find((s) => s.source === 'weatherapi');
  const omIdx = om?.success ? indexByHour(om.hourly) : null;
  const waIdx = wa?.success ? indexByHour(wa.hourly) : null;

  const firstOk = sources.find((s) => s.success && s.hourly.length > 0);
  const bg = backgroundFor(firstOk?.hourly[0]?.condition ?? 'unknown');

  const hours = hourlyHours();
  const rowsBottom = ROWS_TOP + hours.length * ROW_H;

  // Zebra fon + qatorlar
  let rows = '';
  hours.forEach((hour, i) => {
    const rowTop = ROWS_TOP + i * ROW_H;
    if (i % 2 === 1) {
      rows += `<rect x="${MARGIN}" y="${rowTop}" width="${W - 2 * MARGIN}" height="${ROW_H}" rx="14" fill="rgba(255,255,255,0.035)" />`;
    }
    rows += text(timeCenter, rowTop + ROW_H / 2 + 10, `${String(hour).padStart(2, '0')}:00`, {
      size: 30,
      weight: 600,
      fill: COLORS.cream,
    });
    if (om?.success) rows += cell(omIdx?.get(hour), COL1_X, rowTop, hour);
    if (wa?.success) rows += cell(waIdx?.get(hour), COL2_X, rowTop, hour);
  });

  // Ishlamagan manba ustuni: markazda "Ma'lumot olinmadi"
  const failedOverlay = (colX: number, colCenter: number, ok: boolean | undefined): string => {
    if (ok) return '';
    const midY = (ROWS_TOP + rowsBottom) / 2;
    const icon = `<g transform="translate(${colCenter - 30}, ${midY - 96}) scale(0.5)" opacity="0.3">${weatherIconMarkup('unknown')}</g>`;
    return `${icon}${text(colCenter, midY + 8, 'Ma’lumot olinmadi', { size: 30, weight: 500, fill: COLORS.creamMuted })}`;
  };

  // Ustun ajratuvchi vertikal chiziqlar
  const vlines = `
    <line x1="${COL1_X - GAP / 2}" y1="${ROWS_TOP}" x2="${COL1_X - GAP / 2}" y2="${rowsBottom}" stroke="${COLORS.cardStroke}" stroke-width="1.5" />
    <line x1="${COL2_X - GAP / 2}" y1="${ROWS_TOP}" x2="${COL2_X - GAP / 2}" y2="${rowsBottom}" stroke="${COLORS.cardStroke}" stroke-width="1.5" />`;

  const omName = SOURCE_DISPLAY_NAME['open-meteo'].toUpperCase();
  const waName = SOURCE_DISPLAY_NAME.weatherapi.toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bg.top}" />
      <stop offset="1" stop-color="${bg.bottom}" />
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.05" r="0.6">
      <stop offset="0" stop-color="${bg.glow}" />
      <stop offset="1" stop-color="rgba(0,0,0,0)" />
    </radialGradient>
  </defs>

  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bg)" />
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#glow)" />

  <!-- Header -->
  ${text(cx, 104, 'TAMUR', { size: 48, weight: 700, fill: COLORS.copper, spacing: 10 })}
  ${text(cx, 150, 'BUXORO OB-HAVO', { size: 30, weight: 600, fill: COLORS.cream, spacing: 6, opacity: 0.95 })}
  <line x1="${cx - 44}" y1="174" x2="${cx + 44}" y2="174" stroke="${COLORS.copper}" stroke-width="3" stroke-linecap="round" />
  ${text(cx, 232, dateLabel, { size: 34, weight: 500, fill: COLORS.creamMuted })}
  ${text(cx, 274, 'Soatbay prognoz • 2 manba', { size: 24, weight: 500, fill: COLORS.creamFaint, spacing: 1 })}

  <!-- Ustun sarlavhalari -->
  ${text(timeCenter, 344, 'VAQT', { size: 22, weight: 600, fill: COLORS.copper, spacing: 1 })}
  ${text(col1Center, 344, omName, { size: 28, weight: 700, fill: COLORS.copper, spacing: 1 })}
  ${text(col2Center, 344, waName, { size: 28, weight: 700, fill: COLORS.copper, spacing: 1 })}
  ${text(col1Center, 384, om?.success ? rangeStr(om.hourly) : '—', { size: 22, weight: 500, fill: COLORS.creamMuted })}
  ${text(col2Center, 384, wa?.success ? rangeStr(wa.hourly) : '—', { size: 22, weight: 500, fill: COLORS.creamMuted })}
  <line x1="${MARGIN}" y1="410" x2="${W - MARGIN}" y2="410" stroke="${COLORS.cardStroke}" stroke-width="2" />

  <!-- Jadval -->
  ${vlines}
  ${rows}
  ${failedOverlay(COL1_X, col1Center, om?.success)}
  ${failedOverlay(COL2_X, col2Center, wa?.success)}

  <!-- Footer -->
  ${text(cx, FOOTER_Y, `Yangilandi • ${updated}`, { size: 24, weight: 500, fill: COLORS.creamFaint, spacing: 1 })}
</svg>`;
}

/** SVG -> PNG (resvg + lokal Poppins, keyin sharp bilan normallashtirish). */
export async function renderHourlyCardPng(
  sources: HourlySourceResult[],
  opts: HourlyRenderOptions,
): Promise<Buffer> {
  ensureFonts();
  const svg = buildHourlySvg(sources, opts);
  const resvg = new Resvg(svg, {
    background: COLORS.navyDeep,
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: FONT_FAMILY },
  });
  const rasterPng = resvg.render().asPng();
  return sharp(rasterPng).resize(W, H, { fit: 'fill' }).png({ compressionLevel: 9 }).toBuffer();
}

export const HOURLY_CANVAS = { width: W, height: H } as const;
