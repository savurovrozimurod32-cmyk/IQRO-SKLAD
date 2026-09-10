import { getEnv, requireTelegram } from '../config/env.js';
import { renderWeatherCardPng } from '../design/renderWeatherCard.js';
import { fetchAllSources, successCount } from '../sources/index.js';
import { sendPhoto } from '../telegram/sendPhoto.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage, logger } from '../utils/logger.js';
import { orderedSample } from '../weather/sample.js';
import type { WeatherSourceResult } from '../weather/types.js';

/**
 * `npm run send:test`
 * Telegram guruhga TEST ob-havo kartasini yuboradi (real yoki fixture).
 * Haqiqiy Telegram sozlamalarini talab qiladi.
 */
async function main(): Promise<void> {
  const env = getEnv();
  requireTelegram(env);
  const tz = env.WEATHER_TIMEZONE;
  const date = zonedDateISO(tz);

  let sources: WeatherSourceResult[] = await fetchAllSources(tz);
  const ok = successCount(sources);
  if (ok >= env.MIN_SUCCESSFUL_SOURCES) {
    logger.info('send:test', `real ob-havo (${ok}/${sources.length} manba)`);
  } else {
    logger.warn('send:test', `real manba yetarli emas (${ok}/${sources.length}); fixture yuboriladi`);
    sources = orderedSample(tz);
  }

  const png = await renderWeatherCardPng(sources, { city: env.WEATHER_CITY, date, timezone: tz });
  await sendPhoto(png, 'TEST • Buxoro ob-havo');
  logger.info('send:test', 'test kartasi yuborildi');
}

main().catch((err) => {
  logger.error('send:test', errorMessage(err));
  process.exitCode = 1;
});
