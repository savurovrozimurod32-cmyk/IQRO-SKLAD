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

  // Hech qanday rasm yuborilmasa (data umuman yo'q) — cron uchun fail.
  process.exitCode = result.sent > 0 ? 0 : 1;
}

main().catch((err) => {
  logger.error('weather', `job kutilmagan xato bilan tugadi: ${errorMessage(err)}`);
  process.exitCode = 1;
});
