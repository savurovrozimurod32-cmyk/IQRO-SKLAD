import { getEnv } from '../config/env.js';
import { renderWeatherCardPng } from '../design/renderWeatherCard.js';
import { fetchAllSources } from '../sources/index.js';
import { notifyAdmin, sendPhoto } from '../telegram/sendPhoto.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage, logger } from '../utils/logger.js';
import { computeConsensus } from '../weather/consensus.js';
import type { FinalWeather } from '../weather/types.js';

export interface DailyResult {
  sent: boolean;
  blocked: boolean;
  reason?: string;
  successCount: number;
  final?: FinalWeather;
}

/**
 * To'liq kunlik oqim:
 *   providerlar -> consensus -> PNG -> Telegram.
 * - < MIN_SUCCESSFUL_SOURCES bo'lsa: rasm yuborilmaydi, admin ogohlantiriladi.
 * - PNG render fail bo'lsa: Telegram yuborilmaydi.
 * `dryRun` -> hamma narsa bajariladi, lekin Telegram yuborilmaydi.
 */
export async function runDailyWeather(opts: { dryRun?: boolean } = {}): Promise<DailyResult> {
  const env = getEnv();
  const tz = env.WEATHER_TIMEZONE;
  logger.info('weather', 'starting daily job');

  const sources = await fetchAllSources();
  for (const s of sources) {
    if (!s.success) logger.warn(s.source, `failed: ${s.error ?? 'noma‘lum xato'}`);
  }

  const consensus = computeConsensus(sources, {
    city: env.WEATHER_CITY,
    date: zonedDateISO(tz),
    minSuccessfulSources: env.MIN_SUCCESSFUL_SOURCES,
  });
  logger.info('consensus', `${consensus.successCount}/${sources.length} sources`);

  if (!consensus.ok) {
    logger.error('weather', `post bloklandi: ${consensus.reason}`);
    await notifyAdmin(`⚠️ Buxoro ob-havo posti yuborilmadi.\nSabab: ${consensus.reason}`).catch(
      () => logger.error('weather', 'admin ogohlantirishi yuborilmadi'),
    );
    return { sent: false, blocked: true, reason: consensus.reason, successCount: consensus.successCount };
  }

  let png: Buffer;
  try {
    png = await renderWeatherCardPng(consensus.final, { timezone: tz });
    logger.info('render', 'PNG generated');
  } catch (err) {
    const msg = errorMessage(err);
    logger.error('render', `PNG render xatosi: ${msg}`);
    await notifyAdmin(`❗️Ob-havo rasmi yaratilmadi (render xato): ${msg}`).catch(() => {});
    return { sent: false, blocked: true, reason: `render: ${msg}`, successCount: consensus.successCount, final: consensus.final };
  }

  if (opts.dryRun) {
    logger.info('weather', 'dry-run: Telegram ga yuborilmadi');
    return { sent: false, blocked: false, successCount: consensus.successCount, final: consensus.final };
  }

  await sendPhoto(png);
  logger.info('weather', 'job completed');
  return { sent: true, blocked: false, successCount: consensus.successCount, final: consensus.final };
}
