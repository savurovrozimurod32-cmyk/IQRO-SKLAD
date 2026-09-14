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
