import { getEnv, requireTelegram } from '../config/env.js';
import { renderWeatherCardPng } from '../design/renderWeatherCard.js';
import { fetchAllSources } from '../sources/index.js';
import { sendPhoto } from '../telegram/sendPhoto.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage, logger } from '../utils/logger.js';
import { computeConsensus } from '../weather/consensus.js';
import { sampleFinal } from '../weather/sample.js';
import type { FinalWeather } from '../weather/types.js';

/**
 * `npm run send:test`
 * Telegram guruhga TEST ob-havo kartasini yuboradi (real yoki fixture).
 * Bu haqiqiy Telegram sozlamalarini talab qiladi.
 */
async function main(): Promise<void> {
  const env = getEnv();
  requireTelegram(env); // yo'q bo'lsa aniq xato beradi
  const tz = env.WEATHER_TIMEZONE;

  let final: FinalWeather;
  const sources = await fetchAllSources();
  const consensus = computeConsensus(sources, {
    city: env.WEATHER_CITY,
    date: zonedDateISO(tz),
    minSuccessfulSources: env.MIN_SUCCESSFUL_SOURCES,
  });
  if (consensus.ok) {
    logger.info('send:test', `real ob-havo (${consensus.successCount} manba)`);
    final = consensus.final;
  } else {
    logger.warn('send:test', `real ma‘lumot yetarli emas (${consensus.reason}); fixture yuboriladi`);
    final = sampleFinal(tz);
  }

  const png = await renderWeatherCardPng(final, { timezone: tz });
  await sendPhoto(png, 'TEST • Buxoro ob-havo');
  logger.info('send:test', 'test kartasi yuborildi');
}

main().catch((err) => {
  logger.error('send:test', errorMessage(err));
  process.exitCode = 1;
});
