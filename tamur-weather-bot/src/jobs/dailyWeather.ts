import { getEnv } from '../config/env.js';
import { renderWeatherCardPng } from '../design/renderWeatherCard.js';
import { fetchAllSources, successCount } from '../sources/index.js';
import { notifyAdmin, sendPhoto } from '../telegram/sendPhoto.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage, logger } from '../utils/logger.js';
import type { WeatherSourceResult } from '../weather/types.js';

export interface DailyResult {
  sent: boolean;
  blocked: boolean;
  reason?: string;
  successCount: number;
  sources?: WeatherSourceResult[];
}

/**
 * To'liq kunlik oqim (yangi talab — consensus YO'Q):
 *   3 provider fetch -> 3 alohida karta -> PNG -> Telegram.
 * - 0/3 bo'lsa: rasm yuborilmaydi (job fail), admin ogohlantiriladi.
 * - >=1 (MIN_SUCCESSFUL_SOURCES) bo'lsa: yuboriladi; ishlamagan manba
 *   kartada "Ma'lumot olinmadi" bo'lib chiqadi.
 * `dryRun` -> hammasi bajariladi, lekin Telegram yuborilmaydi.
 */
export async function runDailyWeather(opts: { dryRun?: boolean } = {}): Promise<DailyResult> {
  const env = getEnv();
  const tz = env.WEATHER_TIMEZONE;
  const date = zonedDateISO(tz);
  logger.info('weather', 'starting daily job');

  const sources = await fetchAllSources(tz);
  for (const s of sources) {
    if (!s.success) logger.warn(s.source, `failed: ${s.error ?? 'noma‘lum xato'}`);
  }
  const ok = successCount(sources);
  logger.info('sources', `${ok}/${sources.length} sources ok`);

  if (ok < env.MIN_SUCCESSFUL_SOURCES) {
    const reason = `Yetarli manba yo‘q: ${ok}/${sources.length} (kamida ${env.MIN_SUCCESSFUL_SOURCES})`;
    logger.error('weather', `post bloklandi: ${reason}`);
    await notifyAdmin(`⚠️ Buxoro ob-havo posti yuborilmadi.\nSabab: ${reason}`).catch(() =>
      logger.error('weather', 'admin ogohlantirishi yuborilmadi'),
    );
    return { sent: false, blocked: true, reason, successCount: ok, sources };
  }

  let png: Buffer;
  try {
    png = await renderWeatherCardPng(sources, { city: env.WEATHER_CITY, date, timezone: tz });
    logger.info('render', 'PNG generated');
  } catch (err) {
    const msg = errorMessage(err);
    logger.error('render', `PNG render xatosi: ${msg}`);
    await notifyAdmin(`❗️Ob-havo rasmi yaratilmadi (render xato): ${msg}`).catch(() => {});
    return { sent: false, blocked: true, reason: `render: ${msg}`, successCount: ok, sources };
  }

  if (opts.dryRun) {
    logger.info('weather', 'dry-run: Telegram ga yuborilmadi');
    return { sent: false, blocked: false, successCount: ok, sources };
  }

  await sendPhoto(png);
  logger.info('weather', 'job completed');
  return { sent: true, blocked: false, successCount: ok, sources };
}
