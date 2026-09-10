import { zonedDateISO } from '../utils/datetime.js';
import { logger } from '../utils/logger.js';
import { HOURLY_SOURCE_ORDER } from '../weather/types.js';
import type { HourlySourceId, HourlySourceResult } from '../weather/types.js';
import { fetchOpenMeteoHourly } from './openMeteoHourly.js';
import { fetchWeatherApiHourly } from './weatherApiHourly.js';

export { fetchOpenMeteoHourly, fetchWeatherApiHourly };

// Eslatma: MET Norway adapteri (`metNorway.ts`) kodda saqlanadi, lekin
// production oqimdan (fetch/render/log) butunlay chiqarilgan — endi faqat
// Open-Meteo va WeatherAPI ishlatiladi.

function failedHourly(source: HourlySourceId, date: string, error: string): HourlySourceResult {
  return { source, date, hourly: [], success: false, error };
}

/**
 * 2 manbaning bugungi soatbay prognozini parallel va izolatsiyalangan olar.
 * DOIMO 2 natija qaytaradi (HOURLY_SOURCE_ORDER: open-meteo, keyin weatherapi).
 * Bir manbaning xatosi ikkinchisiga ta'sir qilmaydi (allSettled).
 */
export async function fetchHourlySources(timezone: string): Promise<HourlySourceResult[]> {
  const date = zonedDateISO(timezone);
  const settled = await Promise.allSettled([fetchOpenMeteoHourly(), fetchWeatherApiHourly()]);
  return settled.map((s, i) => {
    const source = HOURLY_SOURCE_ORDER[i] as HourlySourceId;
    if (s.status === 'fulfilled') return s.value;
    logger.error('sources', `${source} kutilmagan xatolik: ${String(s.reason)}`);
    return failedHourly(source, date, 'kutilmagan xatolik');
  });
}

/** Muvaffaqiyatli (soatbay ma'lumot olingan) manbalar soni. */
export function successCount(sources: HourlySourceResult[]): number {
  return sources.filter((s) => s.success && s.hourly.length > 0).length;
}

/** Final qoida: kamida bitta manba ishlasa post yuboriladi; 0/2 bo'lsa bloklanadi. */
export function shouldSend(sources: HourlySourceResult[]): boolean {
  return successCount(sources) > 0;
}
