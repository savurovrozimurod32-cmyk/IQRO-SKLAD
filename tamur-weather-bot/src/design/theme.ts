import type { WeatherCondition } from '../weather/types.js';

/**
 * TAMUR dizayn tizimi (weather card).
 *
 * BREND ESLATMASI: quyidagi navy/copper HEX qiymatlari brend faylidagi
 * `#TODO_NAVY` / `#TODO_COPPER` o'rniga qo'yilgan, ishlab chiqarishga xavfsiz
 * standart qiymatlar. Rasmiy TAMUR kodlari tasdiqlangach — faqat SHU faylni
 * o'zgartirish kifoya (butun dizayn markazlashtirilgan).
 */
export const COLORS = {
  navy: '#0F2A44',
  navyDeep: '#0A1E33',
  copper: '#C8894F',
  copperSoft: '#D9A876',
  cream: '#F5F0E6',
  creamMuted: 'rgba(245, 240, 230, 0.72)',
  creamFaint: 'rgba(245, 240, 230, 0.45)',
  cardFill: 'rgba(255, 255, 255, 0.06)',
  cardStroke: 'rgba(245, 240, 230, 0.14)',
} as const;

export const CANVAS = {
  width: 1080,
  height: 1350,
  padding: 80,
} as const;

export const FONT_FAMILY = 'Poppins';

/**
 * Ob-havo holatiga qarab fon "kayfiyati" (warm/neutral/cool/cold).
 * Navy asos har doim saqlanadi — dizayn har kuni boshqacha bo'lib ketmaydi.
 * top: yuqori burchakdagi nozik yorug'lik rangi, bottom: pastki to'q navy.
 */
type Mood = { glow: string; top: string; bottom: string };

const MOODS: Record<'warm' | 'neutral' | 'cool' | 'cold', Mood> = {
  warm: { glow: 'rgba(200, 137, 79, 0.28)', top: '#173453', bottom: '#0A1D30' },
  neutral: { glow: 'rgba(150, 170, 190, 0.16)', top: '#13304C', bottom: '#0A1C2F' },
  cool: { glow: 'rgba(90, 140, 190, 0.22)', top: '#123651', bottom: '#0A1E33' },
  cold: { glow: 'rgba(150, 185, 215, 0.22)', top: '#17384F', bottom: '#0B2233' },
};

export function backgroundFor(condition: WeatherCondition): Mood {
  switch (condition) {
    case 'clear':
      return MOODS.warm;
    case 'partly_cloudy':
    case 'cloudy':
    case 'fog':
    case 'unknown':
      return MOODS.neutral;
    case 'drizzle':
    case 'rain':
    case 'heavy_rain':
    case 'thunderstorm':
      return MOODS.cool;
    case 'snow':
      return MOODS.cold;
    default:
      return MOODS.neutral;
  }
}
