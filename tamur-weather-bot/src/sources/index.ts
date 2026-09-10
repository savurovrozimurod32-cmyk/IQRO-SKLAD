import { zonedDateISO } from '../utils/datetime.js';
import { logger } from '../utils/logger.js';
import { SOURCE_ORDER } from '../weather/types.js';
import type { WeatherSourceId, WeatherSourceResult } from '../weather/types.js';
import { fetchMetNorway } from './metNorway.js';
import { fetchOpenMeteo } from './openMeteo.js';
import { fetchWeatherApi } from './weatherApi.js';

export { fetchOpenMeteo, fetchMetNorway, fetchWeatherApi };

/** Kutilmagan reject holati uchun "muvaffaqiyatsiz" placeholder karta. */
function failedPlaceholder(
  source: WeatherSourceId,
  timezone: string,
  error: string,
): WeatherSourceResult {
  return {
    source,
    fetchedAt: new Date().toISOString(),
    forecastDate: zonedDateISO(timezone),
    currentTemperatureC: null,
    minTemperatureC: null,
    maxTemperatureC: null,
    condition: 'unknown',
    precipitationProbability: null,
    precipitationMm: null,
    windSpeedKmh: null,
    windGustKmh: null,
    humidityPercent: null,
    success: false,
    error,
  };
}

/**
 * Uchala providerni parallel va izolatsiyalangan holda chaqiradi.
 * DOIMO 3 ta natija qaytaradi (SOURCE_ORDER tartibida) — shunda rasmda
 * har doim 3 ta karta bo'ladi, ishlamagani "Ma'lumot olinmadi" bo'lib chiqadi.
 * Bir providerning xatosi qolganlariga ta'sir qilmaydi (allSettled).
 */
export async function fetchAllSources(timezone: string): Promise<WeatherSourceResult[]> {
  const settled = await Promise.allSettled([
    fetchOpenMeteo(),
    fetchMetNorway(),
    fetchWeatherApi(),
  ]);

  return settled.map((s, i) => {
    const source = SOURCE_ORDER[i] as WeatherSourceId;
    if (s.status === 'fulfilled') return s.value;
    logger.error('sources', `${source} kutilmagan xatolik: ${String(s.reason)}`);
    return failedPlaceholder(source, timezone, 'kutilmagan xatolik');
  });
}

/** Muvaffaqiyatli manbalar soni. */
export function successCount(sources: WeatherSourceResult[]): number {
  return sources.filter((s) => s.success).length;
}

/**
 * Rasm yuborilsinmi? Kamida `minSuccessful` manba ishlashi kerak.
 * Default 1 — faqat 0/3 bo'lsa yuborilmaydi.
 */
export function shouldSend(sources: WeatherSourceResult[], minSuccessful: number): boolean {
  return successCount(sources) >= minSuccessful;
}
