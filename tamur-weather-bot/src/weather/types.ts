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

/** Consensusdan chiqadigan yakuniy natija. */
export interface FinalWeather {
  city: string;
  date: string; // "YYYY-MM-DD"

  currentTemperatureC: number;

  minTemperatureC: number;
  maxTemperatureC: number;

  condition: WeatherCondition;

  precipitationProbability: number | null;
  precipitationMm: number | null;

  windSpeedKmh: number | null;
  windGustKmh: number | null;

  humidityPercent: number | null;

  summaryUz: string;

  sourceCount: number; // nechta provider hissa qo'shdi (faqat log/ichki uchun)
  generatedAt: string; // ISO timestamp
}
