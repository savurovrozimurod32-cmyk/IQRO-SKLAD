import { getEnv } from './config/env.js';
import { runDailyWeather } from './jobs/dailyWeather.js';
import { errorMessage, logger } from './utils/logger.js';

/**
 * Production entrypoint (`npm run send:daily`).
 * Tashqi cron (masalan Render Cron, 09:00 Asia/Tashkent = 04:00 UTC) buni
 * har kuni ishga tushiradi. Ish tugagach process toza yopiladi.
 */
async function main(): Promise<void> {
  // Env ni startupda validatsiya qilamiz (xato bo'lsa aniq log bilan chiqamiz).
  getEnv();

  const result = await runDailyWeather();

  if (result.sent) {
    process.exitCode = 0;
  } else if (result.blocked) {
    // Yuborilmadi, lekin bu kutilgan holat (yetarli manba yo'q / render xato).
    // Cron uchun "muvaffaqiyatsiz" deб belgilaymiz, admin allaqachon ogohlantirilgan.
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

main().catch((err) => {
  logger.error('weather', `job kutilmagan xato bilan tugadi: ${errorMessage(err)}`);
  process.exitCode = 1;
});
