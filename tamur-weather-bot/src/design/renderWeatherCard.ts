import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { formatUzDate, zonedTimeHHMM } from '../utils/datetime.js';
import { uzLabel } from '../weather/conditions.js';
import type { FinalWeather } from '../weather/types.js';
import { weatherIconMarkup } from './icons.js';
import { CANVAS, COLORS, FONT_FAMILY, backgroundFor } from './theme.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FONT_DIR = resolve(HERE, '../../assets/fonts');
const FONT_FILES = [
  'Poppins-Regular.ttf',
  'Poppins-Medium.ttf',
  'Poppins-SemiBold.ttf',
  'Poppins-Bold.ttf',
].map((f) => resolve(FONT_DIR, f));

/**
 * Font fayllari mavjudligini startupda tekshiramiz — yo'q bo'lsa aniq xato,
 * "sokin fallback" emas (Uzbek harflari noto'g'ri chiqib qolmasin).
 */
function ensureFonts(): void {
  for (const p of FONT_FILES) {
    if (!existsSync(p)) {
      throw new Error(`Font topilmadi: ${p} (assets/fonts to'liq emas)`);
    }
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
  const {
    size,
    weight = 400,
    fill = COLORS.cream,
    anchor = 'middle',
    spacing = 0,
    opacity = 1,
  } = o;
  return `<text x="${x}" y="${y}" font-family="${FONT_FAMILY}" font-size="${size}" font-weight="${weight}" fill="${fill}" fill-opacity="${opacity}" text-anchor="${anchor}" letter-spacing="${spacing}">${escapeXml(content)}</text>`;
}

/** Matnni taxminiy kenglik bo'yicha satrlarga bo'ladi (Poppins ~0.5em/belgi). */
function wrapText(input: string, maxWidth: number, fontSize: number): string[] {
  const approxCharW = fontSize * 0.5;
  const maxChars = Math.max(8, Math.floor(maxWidth / approxCharW));
  const words = input.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w;
    if (candidate.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = candidate;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

interface StatCard {
  label: string;
  value: string;
  unit?: string;
}

function statCard(x: number, y: number, w: number, h: number, c: StatCard): string {
  const cx = x + w / 2;
  const hasUnit = Boolean(c.unit);
  const valueY = hasUnit ? y + 78 : y + 84;
  const unit = hasUnit
    ? text(cx, y + 104, c.unit as string, {
        size: 20,
        weight: 500,
        fill: COLORS.creamMuted,
      })
    : '';
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24"
        fill="${COLORS.cardFill}" stroke="${COLORS.cardStroke}" stroke-width="1.5" />
      ${text(cx, y + 36, c.label, { size: 22, weight: 600, fill: COLORS.copper, spacing: 3 })}
      ${text(cx, valueY, c.value, { size: 52, weight: 600, fill: COLORS.cream })}
      ${unit}
    </g>`;
}

function tempStr(v: number): string {
  return `${v}°`;
}

export interface CardRenderOptions {
  timezone: string;
  /** "Yangilandi • HH:MM" uchun vaqt; berilmasa hozirgi (tz) vaqt olinadi. */
  updatedAtLabel?: string;
}

/** FinalWeather -> to'liq SVG hujjat (1080×1350). */
export function buildCardSvg(final: FinalWeather, opts: CardRenderOptions): string {
  const { width: W, height: H, padding: P } = CANVAS;
  const cx = W / 2;
  const bg = backgroundFor(final.condition);
  const contentW = W - 2 * P;

  const dateLabel = formatUzDate(final.date, opts.timezone);
  const updated = opts.updatedAtLabel ?? zonedTimeHHMM(opts.timezone);

  // --- Ikonka (120-box -> scale) ---
  const iconScale = 2.0;
  const iconBox = 120 * iconScale;
  const iconX = cx - iconBox / 2;
  const iconY = 320;
  const icon = `<g transform="translate(${iconX}, ${iconY}) scale(${iconScale})">${weatherIconMarkup(final.condition)}</g>`;

  // --- Stat kartalar ---
  const gap = 24;
  // A qatori: MIN | MAX
  const aW = (contentW - gap) / 2;
  const aY = 800;
  const cardA1 = statCard(P, aY, aW, 120, { label: 'MIN', value: tempStr(final.minTemperatureC) });
  const cardA2 = statCard(P + aW + gap, aY, aW, 120, {
    label: 'MAX',
    value: tempStr(final.maxTemperatureC),
  });

  // B qatori: YOMG‘IR | SHAMOL | NAMLIK
  const bW = (contentW - 2 * gap) / 3;
  const bY = 944;
  const rainVal =
    final.precipitationProbability !== null
      ? `${final.precipitationProbability}%`
      : final.precipitationMm !== null
        ? `${final.precipitationMm}`
        : '—';
  const rainUnit =
    final.precipitationProbability === null && final.precipitationMm !== null ? 'mm' : undefined;
  const windVal = final.windSpeedKmh !== null ? `${final.windSpeedKmh}` : '—';
  const windUnit = final.windSpeedKmh !== null ? 'km/soat' : undefined;
  const humVal = final.humidityPercent !== null ? `${final.humidityPercent}%` : '—';

  const cardB1 = statCard(P, bY, bW, 120, { label: 'YOMG‘IR', value: rainVal, unit: rainUnit });
  const cardB2 = statCard(P + bW + gap, bY, bW, 120, {
    label: 'SHAMOL',
    value: windVal,
    unit: windUnit,
  });
  const cardB3 = statCard(P + 2 * (bW + gap), bY, bW, 120, { label: 'NAMLIK', value: humVal });

  // --- Xulosa (1-2 satr) ---
  const summaryLines = wrapText(final.summaryUz, 780, 38).slice(0, 2);
  const summaryStartY = 1150;
  const summary = summaryLines
    .map((line, i) =>
      text(cx, summaryStartY + i * 50, line, {
        size: 38,
        weight: 500,
        fill: COLORS.cream,
        opacity: 0.95,
      }),
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bg.top}" />
      <stop offset="1" stop-color="${bg.bottom}" />
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.12" r="0.7">
      <stop offset="0" stop-color="${bg.glow}" />
      <stop offset="1" stop-color="rgba(0,0,0,0)" />
    </radialGradient>
  </defs>

  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bg)" />
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#glow)" />

  <!-- Header -->
  ${text(cx, 140, 'TAMUR', { size: 48, weight: 700, fill: COLORS.copper, spacing: 10 })}
  ${text(cx, 190, 'BUXORO OB-HAVO', { size: 30, weight: 600, fill: COLORS.cream, spacing: 6, opacity: 0.95 })}
  <line x1="${cx - 44}" y1="216" x2="${cx + 44}" y2="216" stroke="${COLORS.copper}" stroke-width="3" stroke-linecap="round" />

  <!-- Sana -->
  ${text(cx, 278, dateLabel, { size: 34, weight: 500, fill: COLORS.creamMuted })}

  <!-- Hero -->
  ${icon}
  ${text(cx, 700, tempStr(final.currentTemperatureC), { size: 180, weight: 700, fill: COLORS.cream })}
  ${text(cx, 762, uzLabel(final.condition), { size: 46, weight: 500, fill: COLORS.copperSoft })}

  <!-- Stat kartalar -->
  ${cardA1}${cardA2}
  ${cardB1}${cardB2}${cardB3}

  <!-- Xulosa -->
  ${summary}

  <!-- Footer -->
  ${text(cx, 1270, `Yangilandi • ${updated}`, { size: 24, weight: 500, fill: COLORS.creamFaint, spacing: 1 })}
</svg>`;
}

/**
 * SVG -> PNG. resvg (lokal Poppins font bufferlari bilan — deterministik,
 * Chromiumsiz, Uzbek harflari to'g'ri) rasterlaydi, sharp esa yakuniy
 * PNG ni normallashtiradi/tasdiqlaydi (1080×1350).
 */
export async function renderWeatherCardPng(
  final: FinalWeather,
  opts: CardRenderOptions,
): Promise<Buffer> {
  ensureFonts();
  const svg = buildCardSvg(final, opts);
  const resvg = new Resvg(svg, {
    background: COLORS.navyDeep,
    fitTo: { mode: 'width', value: CANVAS.width },
    font: {
      fontFiles: FONT_FILES,
      loadSystemFonts: false,
      defaultFontFamily: FONT_FAMILY,
    },
  });
  const rasterPng = resvg.render().asPng();

  // Sharp bilan yakuniy tekshirish/normallashtirish (aniq o'lcham, toza PNG).
  return sharp(rasterPng)
    .resize(CANVAS.width, CANVAS.height, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer();
}
