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

// Legacy: MET Norway adapteri (`metNorway.ts`) shu tipdan foydalanadi.
export type WeatherSourceId = 'open-meteo' | 'met-norway' | 'weatherapi';

/**
 * Legacy per-source natija modeli (metNorway adapteri uchun saqlangan).
 * Final output bu modeldan foydalanmaydi.
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

// ───────────────────── FINAL: 2 RASM (kunlik + 10 kunlik) ─────────────────────
// Telegramga 2 alohida rasm yuboriladi: daily-summary + weekly-forecast.

/** 1-rasm uchun bugungi kun xulosasi (WeatherAPI primary, Open-Meteo fallback). */
export interface DailySummary {
  date: string; // "YYYY-MM-DD" (Asia/Tashkent)
  condition: WeatherCondition;
  maxTempC: number | null; // kunduzgi
  minTempC: number | null; // tungi
  humidityPercent: number | null;
  windKmh: number | null;
  pressureMb: number | null;
  moonPhaseUz: string | null; // o'zbekcha oy fazasi
  sunrise: string | null; // "HH:mm"
  sunset: string | null; // "HH:mm"
  morningTempC: number | null; // Tong (~07:00)
  dayTempC: number | null; // Kun (~14:00)
  eveningTempC: number | null; // Oqshom (~19:00)
  success: boolean;
  error?: string;
}

/** 2-rasm: bir kunning bloki. */
export interface ForecastDay {
  date: string; // "YYYY-MM-DD"
  condition: WeatherCondition;
  maxTempC: number | null; // kunduzgi max
  minTempC: number | null; // tungi min
  precipitationProbability: number | null;
  windKmh: number | null;
}

/** 2-rasm: bugun + keyingi 9 kun (jami 10). */
export interface WeeklyForecast {
  days: ForecastDay[];
  success: boolean;
  error?: string;
}
