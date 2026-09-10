import { getEnv, requireTelegram } from '../config/env.js';
import { runDailyWeather } from '../jobs/dailyWeather.js';
import { errorMessage, logger } from '../utils/logger.js';

/**
 * `npm run send:test`
 * Telegram guruhga real 2 rasmni (kunlik + 10 kunlik) yuboradi — to'liq oqim.
 * Fake/fixture data yuborilmaydi (data kelmasa hech narsa ketmaydi).
 */
async function main(): Promise<void> {
  const env = getEnv();
  requireTelegram(env);
  const result = await runDailyWeather();
  if (result.sent === 0) {
    throw new Error(`TEST: hech qanday rasm yuborilmadi (${result.reason ?? 'data yo‘q'})`);
  }
  logger.info('send:test', `${result.sent} ta test rasm yuborildi`);
}

main().catch((err) => {
  logger.error('send:test', errorMessage(err));
  process.exitCode = 1;
});
