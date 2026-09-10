import { COLORS } from './theme.js';
import type { WeatherCondition } from '../weather/types.js';

/**
 * Lokal vektor (SVG) ob-havo ikonkalari — 120×120 koordinata maydonida.
 * Emoji ISHLATILMAYDI (serverlarda turlicha render bo'ladi), internetdan
 * ham yuklanmaydi. Renderer bularni translate+scale bilan joylashtiradi.
 */

const CREAM = COLORS.cream;
const COPPER = COLORS.copper;
const MOON = COLORS.copperSoft;

/** Yarim oy (kechasi "clear" uchun) — 120-box ichida.
 *  Ikki doira (to'liq + siljitilgan) evenodd bilan ayiriladi -> ishonchli kresent. */
function moon(cx = 62, cy = 60, r = 30): string {
  const circle = (x: number, y: number, rr: number): string =>
    `M ${x - rr} ${y} a ${rr} ${rr} 0 1 0 ${2 * rr} 0 a ${rr} ${rr} 0 1 0 ${-2 * rr} 0 Z`;
  const carveX = cx + r * 0.55;
  const carveY = cy - r * 0.32;
  const carveR = r * 0.95;
  return `<path fill-rule="evenodd" fill="${MOON}" d="${circle(cx, cy, r)} ${circle(carveX, carveY, carveR)}" />`;
}

/** Bulut silueti (bir xil rangdagi doiralar + asos birlashib bulut hosil qiladi). */
function cloud(fill: string, opacity = 0.95): string {
  return `
    <g fill="${fill}" fill-opacity="${opacity}">
      <rect x="28" y="60" width="64" height="24" rx="12" />
      <circle cx="46" cy="58" r="17" />
      <circle cx="68" cy="52" r="21" />
      <circle cx="84" cy="62" r="15" />
    </g>`;
}

/** Quyosh: markaz + nurlar. */
function sun(cx: number, cy: number, r: number, rays = true): string {
  let raysMarkup = '';
  if (rays) {
    const n = 8;
    const inner = r + 8;
    const outer = r + 20;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n;
      const x1 = cx + Math.cos(a) * inner;
      const y1 = cy + Math.sin(a) * inner;
      const x2 = cx + Math.cos(a) * outer;
      const y2 = cy + Math.sin(a) * outer;
      raysMarkup += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${COPPER}" stroke-width="6" stroke-linecap="round" />`;
    }
  }
  return `<g>${raysMarkup}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${COPPER}" /></g>`;
}

/** Tomchi (yomg'ir chizig'i). */
function drop(x: number, y: number, len = 14): string {
  return `<line x1="${x}" y1="${y}" x2="${x - 4}" y2="${y + len}" stroke="${CREAM}" stroke-width="5" stroke-linecap="round" stroke-opacity="0.9" />`;
}

function rainDrops(xs: number[], y = 90, len = 14): string {
  return xs.map((x) => drop(x, y, len)).join('');
}

/** Qor donasi (kichik doira). */
function flakes(xs: number[], y = 92): string {
  return xs
    .map((x) => `<circle cx="${x}" cy="${y}" r="4" fill="${CREAM}" fill-opacity="0.92" />`)
    .join('');
}

export function weatherIconMarkup(condition: WeatherCondition, night = false): string {
  switch (condition) {
    case 'clear':
      return night ? moon(62, 58, 30) : sun(60, 60, 26);

    case 'partly_cloudy':
      return night ? `${moon(44, 42, 18)}${cloud(CREAM)}` : `${sun(46, 44, 16)}${cloud(CREAM)}`;

    case 'cloudy':
      return cloud(CREAM);

    case 'fog':
      return `
        ${cloud(CREAM, 0.85)}
        <g stroke="${CREAM}" stroke-width="5" stroke-linecap="round" stroke-opacity="0.7">
          <line x1="34" y1="94" x2="86" y2="94" />
          <line x1="30" y1="106" x2="78" y2="106" />
        </g>`;

    case 'drizzle':
      return `${cloud(CREAM)}${rainDrops([54, 72], 90, 10)}`;

    case 'rain':
      return `${cloud(CREAM)}${rainDrops([48, 64, 80], 90, 14)}`;

    case 'heavy_rain':
      return `${cloud(CREAM)}${rainDrops([44, 58, 72, 86], 90, 18)}`;

    case 'snow':
      return `${cloud(CREAM)}${flakes([50, 64, 78], 94)}`;

    case 'thunderstorm':
      return `
        ${cloud(CREAM)}
        <polygon points="62,86 50,106 60,106 52,120 76,98 64,98 72,86"
          fill="${COPPER}" />`;

    case 'unknown':
    default:
      return cloud(CREAM, 0.85);
  }
}
