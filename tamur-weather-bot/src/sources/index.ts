import { logger } from '../utils/logger.js';
import type { DailySummary, WeeklyForecast } from '../weather/types.js';
import { fetchOpenMeteoDaily, fetchOpenMeteoWeekly } from './openMeteoForecast.js';
import { fetchWeatherApiDaily, fetchWeatherApiWeekly } from './weatherApiDaily.js';

export { fetchWeatherApiDaily, fetchWeatherApiWeekly, fetchOpenMeteoDaily, fetchOpenMeteoWeekly };

// Eslatma: MET Norway adapteri (`metNorway.ts`) kodda saqlanadi, lekin
// production oqimidan chiqarilgan. Final output = 2 rasm (kunlik + 10 kunlik).

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
  // Ikkalasi ham fail — primary xatosini qaytaramiz
  return { ...primary, error: `WeatherAPI: ${primary.error}; Open-Meteo: ${fallback.error}` };
}

/**
 * 10 kunlik: Open-Meteo PRIMARY (10 kun bepul); ishlamasa WeatherAPI FALLBACK
 * (bepul reja odatda 3 kun).
 */
export async function getWeeklyForecast(): Promise<WeeklyForecast> {
  const primary = await fetchOpenMeteoWeekly();
  if (primary.success) return primary;
  logger.warn('weekly', `Open-Meteo 10-kunlik ishlamadi (${primary.error}); WeatherAPI fallback`);
  const fallback = await fetchWeatherApiWeekly();
  if (fallback.success) return fallback;
  return { ...primary, error: `Open-Meteo: ${primary.error}; WeatherAPI: ${fallback.error}` };
}
