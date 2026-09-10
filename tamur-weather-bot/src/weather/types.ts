/** Barcha providerlar uchun yagona (canonical) ob-havo holati. */
export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy_rain'
  | 'snow'
  | 'thunderstorm'
  | 'unknown';

export type WeatherSourceId = 'open-meteo' | 'met-norway' | 'weatherapi';

/** Rasmda ko'rsatiladigan manba nomlari (endi yashirilmaydi). */
export const SOURCE_DISPLAY_NAME: Record<WeatherSourceId, string> = {
  'open-meteo': 'Open-Meteo',
  'met-norway': 'MET Norway',
  weatherapi: 'WeatherAPI',
};

/** Rasmdagi kartalar doimo shu tartibda chiqadi. */
export const SOURCE_ORDER: WeatherSourceId[] = ['open-meteo', 'met-norway', 'weatherapi'];

/**
 * Har bir provider o'z API formatini shu yagona modelga normalize qiladi.
 * Mavjud bo'lmagan qiymatlar `null` bo'ladi (consensus ularni chetlab o'tadi).
 */
export interface WeatherSourceResult {
  source: WeatherSourceId;

  fetchedAt: string; // ISO timestamp
  forecastDate: string; // "YYYY-MM-DD" (Asia/Tashkent bo'yicha)

  currentTemperatureC: number | null;

  minTemperatureC: number | null;
  maxTemperatureC: number | null;

  condition: WeatherCondition;

  precipitationProbability: number | null; // 0-100
  precipitationMm: number | null;

  windSpeedKmh: number | null;
  windGustKmh: number | null;

  humidityPercent: number | null; // 0-100

  success: boolean;
  error?: string;
}

// ───────────────────────── HOURLY (final talab) ─────────────────────────
// Production oqim endi soatbay prognozga asoslanadi (current/daily emas).
// Faqat 2 manba: Open-Meteo va WeatherAPI. Merge/consensus YO'Q.

export type HourlySourceId = 'open-meteo' | 'weatherapi';

/** Bitta soat uchun prognoz nuqtasi. */
export interface HourlyForecastPoint {
  time: string; // "HH:mm" (Asia/Tashkent local)
  temperatureC: number | null;
  condition: WeatherCondition;
  precipitationProbability: number | null; // 0-100
  windSpeedKmh: number | null;
}

/** Bitta manbaning bugungi soatbay natijasi. */
export interface HourlySourceResult {
  source: HourlySourceId;
  date: string; // "YYYY-MM-DD" (Asia/Tashkent)
  hourly: HourlyForecastPoint[];
  success: boolean;
  error?: string;
}

/** Rasmdagi ustunlar doimo shu tartibda: Open-Meteo, keyin WeatherAPI. */
export const HOURLY_SOURCE_ORDER: HourlySourceId[] = ['open-meteo', 'weatherapi'];

/** Soatbay oyna: 09:00 dan 23:00 gacha (15 ta soat). */
export const HOURLY_START_HOUR = 9;
export const HOURLY_END_HOUR = 23;
