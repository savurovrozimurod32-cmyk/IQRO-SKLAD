import { getEnv } from '../config/env.js';
import { renderHourlyCardPng } from '../design/renderHourlyCard.js';
import { fetchHourlySources, successCount } from '../sources/index.js';
import { notifyAdmin, sendPhoto } from '../telegram/sendPhoto.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage, logger } from '../utils/logger.js';
import type { HourlySourceResult } from '../weather/types.js';

export interface DailyResult {
  sent: boolean;
  blocked: boolean;
  reason?: string;
  successCount: number;
  sources?: HourlySourceResult[];
}

/**
 * To'liq kunlik oqim (final talab — SOATBAY, consensus YO'Q):
 *   2 manba (Open-Meteo, WeatherAPI) bugungi 09:00–23:00 soatbay prognozini oladi
 *   -> ikki ustunli jadval PNG -> Telegram.
 * - 0/2 bo'lsa: rasm yuborilmaydi (job fail), admin ogohlantiriladi.
 * - 1/2 yoki 2/2: yuboriladi; ishlamagan manba ustunida "Ma'lumot olinmadi".
 * `dryRun` -> hammasi bajariladi, lekin Telegram yuborilmaydi.
 */
export async function runDailyWeather(opts: { dryRun?: boolean } = {}): Promise<DailyResult> {
  const env = getEnv();
  const tz = env.WEATHER_TIMEZONE;
  const date = zonedDateISO(tz);
  logger.info('weather', 'starting daily job');

  const sources = await fetchHourlySources(tz);
  for (const s of sources) {
    if (s.success) logger.info(s.source, `hourly ok (${s.hourly.length} soat)`);
    else logger.warn(s.source, `failed: ${s.error ?? 'noma’lum xato'}`);
  }
  const ok = successCount(sources);
  logger.info('sources', `${ok}/${sources.length} sources ok`);

  // Final qoida: faqat 0/2 bo'lsa post bloklanadi.
  if (ok === 0) {
    const reason = `Hech bir ob-havo manbasidan soatbay ma’lumot olinmadi: 0/${sources.length}`;
    logger.error('weather', `post bloklandi: ${reason}`);
    await notifyAdmin(`⚠️ Buxoro soatbay ob-havo posti yuborilmadi.\nSabab: ${reason}`).catch(() =>
      logger.error('weather', 'admin ogohlantirishi yuborilmadi'),
    );
    return { sent: false, blocked: true, reason, successCount: ok, sources };
  }

  let png: Buffer;
  try {
    png = await renderHourlyCardPng(sources, { city: env.WEATHER_CITY, date, timezone: tz });
    logger.info('render', 'PNG generated');
  } catch (err) {
    const msg = errorMessage(err);
    logger.error('render', `PNG render xatosi: ${msg}`);
    await notifyAdmin(`❗️Ob-havo rasmi yaratilmadi (render xato): ${msg}`).catch(() => {});
    return { sent: false, blocked: true, reason: `render: ${msg}`, successCount: ok, sources };
  }

  if (opts.dryRun) {
    logger.info('weather', 'dry-run: Telegramga yuborilmadi');
    return { sent: false, blocked: false, successCount: ok, sources };
  }

  await sendPhoto(png, 'Buxoro • Bugungi soatbay ob-havo');
  logger.info('weather', 'job completed');
  return { sent: true, blocked: false, successCount: ok, sources };
}
