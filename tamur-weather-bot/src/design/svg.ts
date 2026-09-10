import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { COLORS, FONT_FAMILY } from './theme.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FONT_DIR = resolve(HERE, '../../assets/fonts');
export const FONT_FILES = [
  'Poppins-Regular.ttf',
  'Poppins-Medium.ttf',
  'Poppins-SemiBold.ttf',
  'Poppins-Bold.ttf',
].map((f) => resolve(FONT_DIR, f));

export function ensureFonts(): void {
  for (const p of FONT_FILES) {
    if (!existsSync(p)) throw new Error(`Font topilmadi: ${p} (assets/fonts to'liq emas)`);
  }
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface TextOpts {
  size: number;
  weight?: number;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
  spacing?: number;
  opacity?: number;
}

export function text(x: number, y: number, content: string, o: TextOpts): string {
  const { size, weight = 400, fill = COLORS.cream, anchor = 'middle', spacing = 0, opacity = 1 } = o;
  return `<text x="${x}" y="${y}" font-family="${FONT_FAMILY}" font-size="${size}" font-weight="${weight}" fill="${fill}" fill-opacity="${opacity}" text-anchor="${anchor}" letter-spacing="${spacing}">${escapeXml(content)}</text>`;
}

/** SVG hujjatni PNG bufferga aylantiradi (resvg + lokal Poppins, keyin sharp). */
export async function rasterize(svg: string, width: number, height: number): Promise<Buffer> {
  ensureFonts();
  const resvg = new Resvg(svg, {
    background: COLORS.navyDeep,
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: FONT_FAMILY },
  });
  const png = resvg.render().asPng();
  return sharp(png).resize(width, height, { fit: 'fill' }).png({ compressionLevel: 9 }).toBuffer();
}

/** Fon gradient + glow defs (umumiy). */
export function backgroundLayer(
  width: number,
  height: number,
  bg: { top: string; bottom: string; glow: string },
): string {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bg.top}" />
      <stop offset="1" stop-color="${bg.bottom}" />
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.08" r="0.7">
      <stop offset="0" stop-color="${bg.glow}" />
      <stop offset="1" stop-color="rgba(0,0,0,0)" />
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bg)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#glow)" />`;
}
