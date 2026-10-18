/** Astronomik yordamchilar: oy fazasi (o'zbekcha) va quyosh vaqti formati. */

const MOON_PHASE_UZ: Record<string, string> = {
  'New Moon': 'Yangi oy',
  'Waxing Crescent': 'Yosh oy',
  'First Quarter': 'Birinchi chorak',
  'Waxing Gibbous': 'O‘suvchi oy',
  'Full Moon': 'To‘linoy',
  'Waning Gibbous': 'Kamayuvchi oy',
  'Last Quarter': 'Oxirgi chorak',
  'Waning Crescent': 'Qari oy',
};

/** WeatherAPI moon_phase (inglizcha) -> o'zbekcha. */
export function moonPhaseUz(en: string | null | undefined): string | null {
  if (!en) return null;
  return MOON_PHASE_UZ[en.trim()] ?? en.trim();
}

/**
 * Turli formatdagi vaqtni "HH:mm" (24 soat) ga keltiradi:
 *   "06:12 AM" / "07:30 PM"  (WeatherAPI astro)
 *   "2026-09-10T06:12"       (Open-Meteo ISO)
 */
export function to24h(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.trim();

  // ISO: ...THH:mm
  const iso = s.match(/T(\d{1,2}):(\d{2})/);
  if (iso) {
    return `${iso[1]!.padStart(2, '0')}:${iso[2]}`;
  }

  // 12 soat: "6:12 AM" / "07:30 PM"
  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (ampm) {
    let h = Number(ampm[1]);
    const min = ampm[2] as string;
    const mer = (ampm[3] as string).toUpperCase();
    if (mer === 'AM') h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
    return `${String(h).padStart(2, '0')}:${min}`;
  }

  // Allaqachon "HH:mm"
  const hhmm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) return `${hhmm[1]!.padStart(2, '0')}:${hhmm[2]}`;

  return null;
}
