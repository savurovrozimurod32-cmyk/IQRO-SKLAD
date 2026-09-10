import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { getEnv } from '../config/env.js';
import { renderDailyCardPng } from '../design/renderDailyCard.js';
import { renderWeeklyCardPng } from '../design/renderWeeklyCard.js';
import { getDailySummary, getWeeklyForecast } from '../sources/index.js';
import { errorMessage, logger } from '../utils/logger.js';
import { sampleDailySummary, sampleWeeklyForecast } from '../weather/forecastSample.js';
import { buildRecommendation } from '../weather/recommendation.js';
import type { DailySummary, WeeklyForecast } from '../weather/types.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../../output');

/**
 * `npm run preview`
 * Real ma'lumot olishga urinadi; olinmasa fixture. Telegram ga yubormaydi.
 *   output/daily-summary.png  va  output/weekly-forecast.png
 *   --fixture  -> doim namunaviy data
 */
async function main(): Promise<void> {
  const env = getEnv();
  const tz = env.WEATHER_TIMEZONE;
  await mkdir(OUT_DIR, { recursive: true });
  const useFixture = process.argv.includes('--fixture');

  let daily: DailySummary;
  let weekly: WeeklyForecast;
  if (useFixture) {
    logger.info('preview', 'fixture ma‘lumotidan foydalanilmoqda (--fixture)');
    daily = sampleDailySummary(tz);
    weekly = sampleWeeklyForecast(tz);
  } else {
    [daily, weekly] = await Promise.all([getDailySummary(), getWeeklyForecast()]);
    if (!daily.success) {
      logger.warn('preview', `kunlik real data yo‘q (${daily.error}); fixture`);
      daily = sampleDailySummary(tz);
    }
    if (!weekly.success) {
      logger.warn('preview', `10-kunlik real data yo‘q (${weekly.error}); fixture`);
      weekly = sampleWeeklyForecast(tz);
    }
  }

  const dailyPng = await renderDailyCardPng(daily, { city: env.WEATHER_CITY, timezone: tz });
  await writeFile(resolve(OUT_DIR, 'daily-summary.png'), dailyPng);
  const dMeta = await sharp(dailyPng).metadata();
  logger.info('preview', `daily-summary.png: ${dMeta.width}×${dMeta.height} ${dailyPng.length} bayt`);

  const rec = buildRecommendation(weekly.days, tz);
  const weeklyPng = await renderWeeklyCardPng(weekly, rec, { timezone: tz });
  await writeFile(resolve(OUT_DIR, 'weekly-forecast.png'), weeklyPng);
  const wMeta = await sharp(weeklyPng).metadata();
  logger.info('preview', `weekly-forecast.png: ${wMeta.width}×${wMeta.height} ${weeklyPng.length} bayt`);
  if (rec) logger.info('preview', `menejer tavsiyasi: ${rec.lines.join(' | ')}`);
}

main().catch((err) => {
  logger.error('preview', errorMessage(err));
  process.exitCode = 1;
});
