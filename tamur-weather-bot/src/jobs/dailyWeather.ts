import { getEnv } from '../config/env.js';
import { assertProductionLock } from '../config/productionLock.js';
import { renderWeeklyCardPng } from '../design/renderWeeklyCard.js';
import { getWeeklyForecast } from '../sources/index.js';
import { notifyAdmin, sendPhoto } from '../telegram/sendPhoto.js';
import { errorMessage, logger } from '../utils/logger.js';
import { buildRecommendation } from '../weather/recommendation.js';

export interface DailyResult {
  sent: number; // yuborilgan rasm soni (0/1)
  blocked: boolean;
  reason?: string;
}

/**
 * Final oqim: har kuni 09:00 da FAQAT BITTA rasm yuboriladi —
 *   weekly-forecast (10 kunlik kutilayotgan ob-havo) + hafta oxiri savdo indeksi
 *   (Juma +30%, Shanba +50%, Yakshanba +80%) + menejer tavsiyasi.
 * Bugungi (daily) kartasi endi yuborilmaydi.
 * - Data kelmasa: hech narsa yuborilmaydi, admin ogohlantiriladi.
 * `dryRun` -> render qilinadi, Telegram yuborilmaydi.
 */
export async function runDailyWeather(opts: { dryRun?: boolean } = {}): Promise<DailyResult> {
  const env = getEnv();
  assertProductionLock(env);
  if (env.PRODUCTION_LOCK_ENABLED) logger.info('lock', 'production contract verified');

  const tz = env.WEATHER_TIMEZONE;
  logger.info('weather', 'starting daily job');

  const weekly = await getWeeklyForecast();
  logger.info('weekly', weekly.success ? `10-kunlik ok (${weekly.days.length} kun)` : `10-kunlik yo‘q: ${weekly.error}`);

  if (!weekly.success) {
    const reason = `10 kunlik ob-havo ma’lumoti olinmadi: ${weekly.error}`;
    logger.error('weather', `post bloklandi: ${reason}`);
    await notifyAdmin(`⚠️ Buxoro ob-havo posti yuborilmadi.\nSabab: ${reason}`).catch(() =>
      logger.error('weather', 'admin ogohlantirishi yuborilmadi'),
    );
    return { sent: 0, blocked: true, reason };
  }

  let sent = 0;
  try {
    const rec = buildRecommendation(weekly.days, tz);
    const png = await renderWeeklyCardPng(weekly, rec, { timezone: tz });
    logger.info('render', 'weekly-forecast PNG generated');
    if (!opts.dryRun) {
      await sendPhoto(png, 'Buxoro • 10 kunlik kutilayotgan ob-havo');
      sent++;
    }
  } catch (err) {
    logger.error('render', `10-kunlik rasm xatosi: ${errorMessage(err)}`);
    await notifyAdmin(`❗️10-kunlik ob-havo rasmi yuborilmadi: ${errorMessage(err)}`).catch(() => {});
    return { sent: 0, blocked: true, reason: `render: ${errorMessage(err)}` };
  }

  if (opts.dryRun) logger.info('weather', 'dry-run: Telegramga yuborilmadi');
  else logger.info('weather', `job completed — ${sent} rasm yuborildi`);
  return { sent, blocked: false };
}
