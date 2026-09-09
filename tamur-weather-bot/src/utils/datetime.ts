/**
 * Vaqt/sana yordamchilari.
 *
 * MUHIM: Server UTC bo'lsa ham, "bugun" har doim WEATHER_TIMEZONE
 * (Asia/Tashkent) bo'yicha hisoblanadi. Buning uchun `Intl.DateTimeFormat`
 * ning `timeZone` imkoniyatidan foydalanamiz — qo'lda +5 soat qo'shmaymiz.
 */

const UZ_MONTHS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
];

// Intl 'en-US' weekday (long) -> Uzbek
const UZ_WEEKDAYS: Record<string, string> = {
  Sunday: 'Yakshanba',
  Monday: 'Dushanba',
  Tuesday: 'Seshanba',
  Wednesday: 'Chorshanba',
  Thursday: 'Payshanba',
  Friday: 'Juma',
  Saturday: 'Shanba',
};

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  weekdayEn: string; // "Thursday"
}

/** Berilgan vaqt lahzasini ko'rsatilgan timezone bo'yicha qismlarga ajratadi. */
export function zonedParts(timeZone: string, at: Date = new Date()): ZonedParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'long',
  });
  const parts = fmt.formatToParts(at);
  const get = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  // hour 24 formatida ba'zan "24" chiqishi mumkin — normalize
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0;
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour,
    minute: Number(get('minute')),
    weekdayEn: get('weekday'),
  };
}

/** Timezone bo'yicha "YYYY-MM-DD" sanasini qaytaradi. */
export function zonedDateISO(timeZone: string, at: Date = new Date()): string {
  const p = zonedParts(timeZone, at);
  const mm = String(p.month).padStart(2, '0');
  const dd = String(p.day).padStart(2, '0');
  return `${p.year}-${mm}-${dd}`;
}

/**
 * "YYYY-MM-DD" ni o'zbekcha ko'rinishga aylantiradi:
 *   "10 Sentabr • Payshanba"
 */
export function formatUzDate(dateISO: string, timeZone: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const monthName = UZ_MONTHS[(m ?? 1) - 1] ?? '';
  // Hafta kunini aniqlash uchun sanani UTC peshin bilan olamiz (kun surilmasligi uchun)
  const probe = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  const weekdayEn = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  }).format(probe);
  const weekdayUz = UZ_WEEKDAYS[weekdayEn] ?? weekdayEn;
  return `${d} ${monthName} • ${weekdayUz}`;
}

/** "09:00" ko'rinishidagi timezone-local vaqt (rasm pastidagi "Yangilandi"). */
export function zonedTimeHHMM(timeZone: string, at: Date = new Date()): string {
  const p = zonedParts(timeZone, at);
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}
