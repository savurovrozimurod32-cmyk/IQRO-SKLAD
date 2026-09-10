import { logger } from '../utils/logger.js';
import type { DailySummary, WeeklyForecast } from '../weather/types.js';
import { fetchOpenMeteoDaily, fetchOpenMeteoWeekly } from './openMeteoForecast.js';
import { fetchWeatherApiDaily, fetchWeatherApiWeekly } from './weatherApiDaily.js';

export { fetchWeatherApiDaily, fetchWeatherApiWeekly, fetchOpenMeteoDaily, fetchOpenMeteoWeekly };

// Eslatma: MET Norway adapteri (`metNorway.ts`) kodda saqlanadi, lekin
// production oqimidan chiqarilgan. Final output = 2 rasm (kunlik + 10 kunlik).

/** 10 kunlik rasm noto'g'ri nom bilan 3-7 kunlik data yubormasligi uchun contract check. */
export function isFullWeeklyForecast(forecast: WeeklyForecast): boolean {
  return forecast.success && forecast.days.length >= 10;
}

/**
 * Kunlik xulosa: WeatherAPI PRIMARY (oy fazasi, bosim, astro bilan);
 * ishlamasa Open-Meteo FALLBACK (oy fazasi bo'lmaydi).
 */
export async function getDailySummary(): Promise<DailySummary> {
  const primary = await fetchWeatherApiDaily();
  if (primary.success) return primary;
  logger.warn('daily', `WeatherAPI kunlik ishlamadi (${primary.error}); Open-Meteo fallback`);
  const fallback = await fetchOpenMeteoDaily();
  if (fallback.success) return fallback;
  return { ...primary, error: `WeatherAPI: ${primary.error}; Open-Meteo: ${fallback.error}` };
}

/**
 * 10 kunlik: Open-Meteo PRIMARY. Fallback faqat HAQIQIY 10 kun bera olsa qabul qilinadi.
 * Shunda rasm "10 kunlik" deb chiqib, ichida atigi 3 kun bo'lib qolmaydi.
 */
export async function getWeeklyForecast(): Promise<WeeklyForecast> {
  const primary = await fetchOpenMeteoWeekly();
  if (isFullWeeklyForecast(primary)) return { ...primary, days: primary.days.slice(0, 10) };
  logger.warn('weekly', `Open-Meteo to‘liq 10 kun bermadi (${primary.error ?? `${primary.days.length} kun`}); WeatherAPI fallback`);

  const fallback = await fetchWeatherApiWeekly();
  if (isFullWeeklyForecast(fallback)) return { ...fallback, days: fallback.days.slice(0, 10) };

  return {
    days: [],
    success: false,
    error: `10 kunlik data to‘liq emas (Open-Meteo: ${primary.success ? `${primary.days.length} kun` : primary.error}; WeatherAPI: ${fallback.success ? `${fallback.days.length} kun` : fallback.error})`,
  };
}
