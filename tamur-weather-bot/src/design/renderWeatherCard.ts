import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { formatUzDate, zonedTimeHHMM } from '../utils/datetime.js';
import { uzLabel } from '../weather/conditions.js';
import { isNum, round, roundTemp } from '../weather/normalize.js';
import { SOURCE_DISPLAY_NAME } from '../weather/types.js';
import type { WeatherSourceResult } from '../weather/types.js';
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

const tempStr = (v: number | null): string => (isNum(v) ? `${roundTemp(v)}°` : '—');

function heroTemp(s: WeatherSourceResult): string {
  const v = s.currentTemperatureC ?? s.maxTemperatureC ?? s.minTemperatureC;
  return tempStr(v);
}

function rainStat(s: WeatherSourceResult): string {
  if (isNum(s.precipitationProbability)) return `${s.precipitationProbability}%`;
  if (isNum(s.precipitationMm)) return `${round(s.precipitationMm, 1)}mm`;
  return '—';
}

/** Bitta manba kartasi (x, y, w, h ichida). */
function sourceCard(s: WeatherSourceResult, x: number, y: number, w: number, h: number): string {
  const pad = 36;
  const name = (SOURCE_DISPLAY_NAME[s.source] ?? s.source).toUpperCase();

  const frame = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28"
    fill="${COLORS.cardFill}" stroke="${COLORS.cardStroke}" stroke-width="1.5" />`;

  // Ishlamagan manba — "Ma'lumot olinmadi"
  if (!s.success) {
    const cx = x + w / 2;
    const icon = `<g transform="translate(${x + pad}, ${y + 40}) scale(1.0)" opacity="0.35">${weatherIconMarkup('unknown')}</g>`;
    return `
      <g>
        ${frame}
        ${text(x + pad, y + 58, name, { size: 30, weight: 700, fill: COLORS.copper, spacing: 2, anchor: 'start', opacity: 0.75 })}
        ${icon}
        ${text(cx + 40, y + h / 2 + 24, 'Ma’lumot olinmadi', { size: 34, weight: 500, fill: COLORS.creamMuted })}
      </g>`;
  }

  // Ikonka (chap), kondisiya (yonida), katta harorat (o'ng)
  const icon = `<g transform="translate(${x + pad}, ${y + 74}) scale(1.0)">${weatherIconMarkup(s.condition)}</g>`;
  const sep = `<line x1="${x + pad}" y1="${y + 196}" x2="${x + w - pad}" y2="${y + 196}" stroke="${COLORS.cardStroke}" stroke-width="1.5" />`;

  // Pastki stat qatori — 5 ustun
  const innerW = w - 2 * pad;
  const colW = innerW / 5;
  const stats: Array<{ label: string; value: string }> = [
    { label: 'MIN', value: tempStr(s.minTemperatureC) },
    { label: 'MAX', value: tempStr(s.maxTemperatureC) },
    { label: 'YOMG‘IR', value: rainStat(s) },
    { label: 'SHAMOL km/soat', value: isNum(s.windSpeedKmh) ? `${Math.round(s.windSpeedKmh)}` : '—' },
    { label: 'NAMLIK', value: isNum(s.humidityPercent) ? `${s.humidityPercent}%` : '—' },
  ];
  const statMarkup = stats
    .map((st, i) => {
      const cx = x + pad + colW * (i + 0.5);
      return `${text(cx, y + 232, st.label, { size: 17, weight: 600, fill: COLORS.copper, spacing: 1 })}${text(cx, y + 268, st.value, { size: 32, weight: 600, fill: COLORS.cream })}`;
    })
    .join('');

  return `
    <g>
      ${frame}
      ${text(x + pad, y + 58, name, { size: 30, weight: 700, fill: COLORS.copper, spacing: 2, anchor: 'start' })}
      ${icon}
      ${text(x + pad + 132, y + 150, uzLabel(s.condition), { size: 32, weight: 500, fill: COLORS.copperSoft, anchor: 'start' })}
      ${text(x + w - pad, y + 96, heroTemp(s), { size: 92, weight: 700, fill: COLORS.cream, anchor: 'end' })}
      ${sep}
      ${statMarkup}
    </g>`;
}

export interface CardRenderOptions {
  city: string;
  date: string; // "YYYY-MM-DD"
  timezone: string;
  updatedAtLabel?: string;
}

/** 3 ta manba kartasini bitta SVG hujjatga (1080×1350) joylashtiradi. */
export function buildCardsSvg(sources: WeatherSourceResult[], opts: CardRenderOptions): string {
  const { width: W, height: H } = CANVAS;
  const cx = W / 2;
  const P = 60;
  const cardX = P;
  const cardW = W - 2 * P;

  const dateLabel = formatUzDate(opts.date, opts.timezone);
  const updated = opts.updatedAtLabel ?? zonedTimeHHMM(opts.timezone);

  // Fon "kayfiyati" — birinchi ishlagan manbaning holatidan nozik tint
  // (bu MERGE emas, faqat vizual ohang; kartalar mustaqilligicha qoladi).
  const firstOk = sources.find((s) => s.success);
  const bg = backgroundFor(firstOk?.condition ?? 'unknown');

  // 3 karta vertikal stacked
  const cardsTop = 330;
  const gap = 22;
  const cardH = 298;
  const cards = sources
    .map((s, i) => sourceCard(s, cardX, cardsTop + i * (cardH + gap), cardW, cardH))
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bg.top}" />
      <stop offset="1" stop-color="${bg.bottom}" />
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.1" r="0.7">
      <stop offset="0" stop-color="${bg.glow}" />
      <stop offset="1" stop-color="rgba(0,0,0,0)" />
    </radialGradient>
  </defs>

  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bg)" />
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#glow)" />

  <!-- Header -->
  ${text(cx, 120, 'TAMUR', { size: 48, weight: 700, fill: COLORS.copper, spacing: 10 })}
  ${text(cx, 168, 'BUXORO OB-HAVO', { size: 30, weight: 600, fill: COLORS.cream, spacing: 6, opacity: 0.95 })}
  <line x1="${cx - 44}" y1="192" x2="${cx + 44}" y2="192" stroke="${COLORS.copper}" stroke-width="3" stroke-linecap="round" />

  <!-- Sana + neytral izoh -->
  ${text(cx, 250, dateLabel, { size: 34, weight: 500, fill: COLORS.creamMuted })}
  ${text(cx, 296, 'Bugungi prognoz • 3 manba', { size: 24, weight: 500, fill: COLORS.creamFaint, spacing: 1 })}

  <!-- 3 manba kartasi -->
  ${cards}

  <!-- Footer -->
  ${text(cx, 1306, `Yangilandi • ${updated}`, { size: 24, weight: 500, fill: COLORS.creamFaint, spacing: 1 })}
</svg>`;
}

/**
 * SVG -> PNG. resvg (lokal Poppins font — deterministik, Chromiumsiz, Uzbek
 * harflari to'g'ri) rasterlaydi, sharp yakuniy PNG ni normallashtiradi.
 */
export async function renderWeatherCardPng(
  sources: WeatherSourceResult[],
  opts: CardRenderOptions,
): Promise<Buffer> {
  ensureFonts();
  const svg = buildCardsSvg(sources, opts);
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
  return sharp(rasterPng)
    .resize(CANVAS.width, CANVAS.height, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer();
}
