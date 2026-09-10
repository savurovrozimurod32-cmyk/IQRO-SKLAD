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
