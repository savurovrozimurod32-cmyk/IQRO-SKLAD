import { getEnv, requireTelegram } from '../config/env.js';
import { renderHourlyCardPng } from '../design/renderHourlyCard.js';
import { fetchHourlySources, successCount } from '../sources/index.js';
import { sendPhoto } from '../telegram/sendPhoto.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage, logger } from '../utils/logger.js';
import type { HourlySourceResult } from '../weather/types.js';

/**
 * `npm run send:test`
 * Telegram guruhga TEST soatbay ob-havo jadvalini yuboradi.
 * Muhim: fixture/fake data yubormaydi — kamida bitta real manba ishlashi shart.
 */
async function main(): Promise<void> {
  const env = getEnv();
  requireTelegram(env);
  const tz = env.WEATHER_TIMEZONE;
  const date = zonedDateISO(tz);

  const sources: HourlySourceResult[] = await fetchHourlySources(tz);
  const ok = successCount(sources);
  if (ok === 0) {
    throw new Error('TEST yuborilmadi: 0/2 real soatbay manba ishladi. Fake/fixture data yuborilmaydi.');
  }

  logger.info('send:test', `real soatbay ob-havo (${ok}/${sources.length} manba)`);
  const png = await renderHourlyCardPng(sources, { city: env.WEATHER_CITY, date, timezone: tz });
  await sendPhoto(png, 'TEST • Buxoro soatbay ob-havo');
  logger.info('send:test', 'test jadvali yuborildi');
}

main().catch((err) => {
  logger.error('send:test', errorMessage(err));
  process.exitCode = 1;
});
