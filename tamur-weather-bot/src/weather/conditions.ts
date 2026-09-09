import type { WeatherCondition } from './types.js';

/** O'zbekcha (lotin) ko'rinish nomlari — UI uchun. */
export const UZ_CONDITION_LABEL: Record<WeatherCondition, string> = {
  clear: 'Quyoshli',
  partly_cloudy: 'Qisman bulutli',
  cloudy: 'Bulutli',
  fog: 'Tumanli',
  drizzle: 'Mayda yomg‘ir',
  rain: 'Yomg‘irli',
  heavy_rain: 'Kuchli yomg‘ir',
  snow: 'Qor',
  thunderstorm: 'Momaqaldiroq',
  unknown: 'Ob-havo o‘zgaruvchan',
};

/**
 * Jiddiylik darajasi (priority). Katta son = jiddiyroq holat.
 * Consensusda ovozlar teng chiqsa yoki qaror kerak bo'lsa ishlatiladi.
 */
const SEVERITY: Record<WeatherCondition, number> = {
  thunderstorm: 9,
  heavy_rain: 8,
  rain: 7,
  drizzle: 6,
  snow: 5,
  fog: 4,
  cloudy: 3,
  partly_cloudy: 2,
  clear: 1,
  unknown: 0,
};

export function severity(c: WeatherCondition): number {
  return SEVERITY[c];
}

export function uzLabel(c: WeatherCondition): string {
  return UZ_CONDITION_LABEL[c];
}

/**
 * Open-Meteo WMO weather code -> canonical condition.
 * Ref: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
 */
export function fromOpenMeteoCode(code: number | null | undefined): WeatherCondition {
  if (code === null || code === undefined) return 'unknown';
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle';
  if ([61, 63, 66, 67, 80, 81].includes(code)) return 'rain';
  if ([65, 82].includes(code)) return 'heavy_rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ([95, 96, 99].includes(code)) return 'thunderstorm';
  return 'unknown';
}

/**
 * MET Norway symbol_code (masalan "partlycloudy_day", "heavyrain") -> canonical.
 * Kalit so'z bo'yicha aniqlaymiz — bu suffix (_day/_night)dan mustaqil ishonchli.
 */
export function fromMetSymbol(symbol: string | null | undefined): WeatherCondition {
  if (!symbol) return 'unknown';
  const s = symbol.toLowerCase();
  if (s.includes('thunder')) return 'thunderstorm';
  if (s.includes('snow') || s.includes('sleet')) return 'snow';
  if (s.includes('heavyrain')) return 'heavy_rain';
  if (s.includes('lightrain') || s.includes('drizzle')) return 'drizzle';
  if (s.includes('rain')) return 'rain';
  if (s.includes('fog')) return 'fog';
  if (s.includes('cloudy') && !s.includes('partlycloudy')) return 'cloudy';
  if (s.includes('partlycloudy') || s.includes('fair')) return 'partly_cloudy';
  if (s.includes('clearsky')) return 'clear';
  return 'unknown';
}

/**
 * WeatherAPI.com condition code -> canonical.
 * Ref: https://www.weatherapi.com/docs/weather_conditions.json
 */
export function fromWeatherApiCode(code: number | null | undefined): WeatherCondition {
  if (code === null || code === undefined) return 'unknown';
  const map: Record<number, WeatherCondition> = {
    1000: 'clear',
    1003: 'partly_cloudy',
    1006: 'cloudy',
    1009: 'cloudy',
    1030: 'fog',
    1135: 'fog',
    1147: 'fog',
    1063: 'rain',
    1150: 'drizzle',
    1153: 'drizzle',
    1168: 'drizzle',
    1171: 'drizzle',
    1072: 'drizzle',
    1180: 'rain',
    1183: 'rain',
    1186: 'rain',
    1189: 'rain',
    1192: 'heavy_rain',
    1195: 'heavy_rain',
    1198: 'rain',
    1201: 'rain',
    1240: 'rain',
    1243: 'rain',
    1246: 'heavy_rain',
    1066: 'snow',
    1069: 'snow',
    1114: 'snow',
    1117: 'snow',
    1204: 'snow',
    1207: 'snow',
    1210: 'snow',
    1213: 'snow',
    1216: 'snow',
    1219: 'snow',
    1222: 'snow',
    1225: 'snow',
    1237: 'snow',
    1249: 'snow',
    1252: 'snow',
    1255: 'snow',
    1258: 'snow',
    1261: 'snow',
    1264: 'snow',
    1087: 'thunderstorm',
    1273: 'thunderstorm',
    1276: 'thunderstorm',
    1279: 'thunderstorm',
    1282: 'thunderstorm',
  };
  return map[code] ?? 'unknown';
}
