import { getEnv } from '../config/env.js';
import { assertProductionLock } from '../config/productionLock.js';
import { renderDailyCardPng } from '../design/renderDailyCard.js';
import { renderWeeklyCardPng } from '../design/renderWeeklyCard.js';
import { getDailySummary, getWeeklyForecast } from '../sources/index.js';
import { notifyAdmin, sendPhoto } from '../telegram/sendPhoto.js';
import { errorMessage, logger } from '../utils/logger.js';
import { buildRecommendation } from '../weather/recommendation.js';

export interface DailyResult {
  sent: number; // yuborilgan rasm soni (0/1/2)
  blocked: boolean;
  reason?: string;
}

/**
 * Final oqim: har kuni 09:00 da 2 ta rasm yuboriladi —
 *   1) daily-summary  (WeatherAPI primary, Open-Meteo fallback)
 *   2) weekly-forecast (Open-Meteo 10 kun) + menejer tavsiyasi
 * - Ikkala data ham kelmasa: hech narsa yuborilmaydi, admin ogohlantiriladi.
 * - Bittasi ishlab, ikkinchisi xato bersa: ishlagani baribir yuboriladi.
 * `dryRun` -> render qilinadi, Telegram yuborilmaydi.
 */
export async function runDailyWeather(opts: { dryRun?: boolean } = {}): Promise<DailyResult> {
  const env = getEnv();
  assertProductionLock(env);
  if (env.PRODUCTION_LOCK_ENABLED) logger.info('lock', 'production contract verified');

  const tz = env.WEATHER_TIMEZONE;
  logger.info('weather', 'starting daily job');

  const [daily, weekly] = await Promise.all([getDailySummary(), getWeeklyForecast()]);
  logger.info('daily', daily.success ? 'kunlik data ok' : `kunlik data yo‘q: ${daily.error}`);
  logger.info('weekly', weekly.success ? `10-kunlik ok (${weekly.days.length} kun)` : `10-kunlik yo‘q: ${weekly.error}`);

  if (!daily.success && !weekly.success) {
    const reason = `Ob-havo ma’lumoti umuman olinmadi (kunlik: ${daily.error}; 10-kunlik: ${weekly.error})`;
    logger.error('weather', `post bloklandi: ${reason}`);
    await notifyAdmin(`⚠️ Buxoro ob-havo posti yuborilmadi.\nSabab: ${reason}`).catch(() =>
      logger.error('weather', 'admin ogohlantirishi yuborilmadi'),
    );
    return { sent: 0, blocked: true, reason };
  }

  let sent = 0;

  // 1-rasm: kunlik
  if (daily.success) {
    try {
      const png = await renderDailyCardPng(daily, { city: env.WEATHER_CITY, timezone: tz });
      logger.info('render', 'daily-summary PNG generated');
      if (!opts.dryRun) {
        await sendPhoto(png, 'Buxoro • Bugungi ob-havo');
        sent++;
      }
    } catch (err) {
      logger.error('render', `kunlik rasm xatosi: ${errorMessage(err)}`);
      await notifyAdmin(`❗️Kunlik ob-havo rasmi yuborilmadi: ${errorMessage(err)}`).catch(() => {});
    }
  }

  // 2-rasm: 10 kunlik + menejer tavsiyasi
  if (weekly.success) {
    try {
      const rec = buildRecommendation(weekly.days, tz);
      const png = await renderWeeklyCardPng(weekly, rec, { timezone: tz });
      logger.info('render', 'weekly-forecast PNG generated');
      if (!opts.dryRun) {
        await sendPhoto(png, 'Buxoro • 10 kunlik bashorat');
        sent++;
      }
    } catch (err) {
      logger.error('render', `10-kunlik rasm xatosi: ${errorMessage(err)}`);
      await notifyAdmin(`❗️10-kunlik ob-havo rasmi yuborilmadi: ${errorMessage(err)}`).catch(() => {});
    }
  }

  if (opts.dryRun) logger.info('weather', 'dry-run: Telegramga yuborilmadi');
  else logger.info('weather', `job completed — ${sent} rasm yuborildi`);
  return { sent, blocked: false };
}
