/**
 * Sof (pure) sonli yordamchilar. Providerlar va consensus shulardan foydalanadi.
 * Null qiymatlar hamma joyda xavfsiz chetlab o'tiladi.
 */

export function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Faqat haqiqiy sonlarni qoldiradi. */
export function compact(values: Array<number | null | undefined>): number[] {
  return values.filter(isNum);
}

/** Butun songacha yaxlitlash (35.7 -> 36). */
export function round(v: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

/** Temperaturani foydalanuvchi uchun yaxlitlaydi (35.7 -> 36). */
export function roundTemp(v: number): number {
  return Math.round(v);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function clampPercent(v: number | null): number | null {
  if (!isNum(v)) return null;
  return clamp(Math.round(v), 0, 100);
}

/** m/s -> km/soat. */
export function msToKmh(ms: number | null | undefined): number | null {
  if (!isNum(ms)) return null;
  return ms * 3.6;
}

export function mean(values: Array<number | null | undefined>): number | null {
  const nums = compact(values);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Median — outlierlarga chidamli markaziy qiymat.
 *   [35, 36, 44] -> 36
 *   [10, 20]     -> 15
 */
export function median(values: Array<number | null | undefined>): number | null {
  const nums = compact(values).slice().sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  if (nums.length % 2 === 1) return nums[mid] as number;
  return ((nums[mid - 1] as number) + (nums[mid] as number)) / 2;
}

export function minOf(values: Array<number | null | undefined>): number | null {
  const nums = compact(values);
  if (nums.length === 0) return null;
  return Math.min(...nums);
}

export function maxOf(values: Array<number | null | undefined>): number | null {
  const nums = compact(values);
  if (nums.length === 0) return null;
  return Math.max(...nums);
}
