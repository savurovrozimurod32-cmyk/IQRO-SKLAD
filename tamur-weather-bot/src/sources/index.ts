import { logger } from '../utils/logger.js';
import type { WeatherSourceResult } from '../weather/types.js';
import { fetchMetNorway } from './metNorway.js';
import { fetchOpenMeteo } from './openMeteo.js';
import { fetchWeatherApi } from './weatherApi.js';

export { fetchOpenMeteo, fetchMetNorway, fetchWeatherApi };

/**
 * Uchala providerni parallel va izolatsiyalangan holda chaqiradi.
 * Bir providerning xatosi qolganlariga ta'sir qilmaydi (allSettled).
 * Har bir provider o'zi ichida xatoni ushlab success:false qaytaradi,
 * shuning uchun rejected holat kutilmaydi, lekin baribir himoyalanamiz.
 */
export async function fetchAllSources(): Promise<WeatherSourceResult[]> {
  const settled = await Promise.allSettled([
    fetchOpenMeteo(),
    fetchMetNorway(),
    fetchWeatherApi(),
  ]);

  const results: WeatherSourceResult[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled') {
      results.push(s.value);
    } else {
      // Kutilmagan reject — logga yozamiz, lekin jobni yiqitmaymiz.
      logger.error('sources', `kutilmagan xatolik: ${String(s.reason)}`);
    }
  }
  return results;
}
