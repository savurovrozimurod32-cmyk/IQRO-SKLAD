/**
 * Static biznes signallari (ob-havoga bog'liq EMAS).
 * Kunlik kartadagi "hafta oxiri savdo indeksi" bloki shulardan chiziladi.
 * Bu qiymatlar past savdo kunlariga NISBATAN ehtimoliy farqni bildiradi.
 */
export interface WeekendSale {
  day: string; // "Juma" / "Shanba" / "Yakshanba"
  percent: number; // 30 / 50 / 80
  label: string; // "+30%"
  accent: string; // pill rangi (rang mantiqi bo'yicha)
}

export const WEEKEND_SALES: readonly WeekendSale[] = [
  { day: 'Juma', percent: 30, label: '+30%', accent: '#E6B15E' }, // och to'q sariq / sariq
  { day: 'Shanba', percent: 50, label: '+50%', accent: '#D9822B' }, // to'q sariq
  { day: 'Yakshanba', percent: 80, label: '+80%', accent: '#46B277' }, // yashil / kuchli accent
];

export const WEEKEND_SALES_TITLE = 'Hafta oxiri savdo indeksi';
export const WEEKEND_SALES_NOTE = 'Past savdo kunlariga nisbatan';

/**
 * Foizga qarab rang: YUQORI foiz — yashil, pasaygan sari qizarib boradi.
 * Tartib (yuqoridan pastga): yashil → sariq → olovrang → qizil → to'q qizil.
 */
export const PERCENT_COLORS = {
  green: '#3BA862', // yashil (eng yuqori)
  yellow: '#E3BE3E', // sariq
  flame: '#E5812F', // olovrang
  red: '#D6442F', // qizil
  darkRed: '#9E2820', // to'q qizil (eng past)
} as const;

export function colorForPercent(percent: number): string {
  if (percent >= 65) return PERCENT_COLORS.green;
  if (percent >= 45) return PERCENT_COLORS.yellow;
  if (percent >= 35) return PERCENT_COLORS.flame;
  if (percent >= 20) return PERCENT_COLORS.red;
  return PERCENT_COLORS.darkRed;
}

/**
 * QAT'IY BIZNES QOIDASI:
 * Shanba va Yakshanba kuni ob-havodan qat'i nazar xodimlarga javob berilmaydi.
 * Bu qoida ob-havo recommendationidan USTUN turadi.
 */
export const WEEKEND_STAFF_POLICY =
  'Shanba va Yakshanba — ob-havodan qat’i nazar xodimlarga javob berilmaydi.';
