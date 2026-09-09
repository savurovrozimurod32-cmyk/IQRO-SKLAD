import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { getEnv } from '../config/env.js';
import { renderWeatherCardPng } from '../design/renderWeatherCard.js';
import { fetchAllSources } from '../sources/index.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage, logger } from '../utils/logger.js';
import { computeConsensus } from '../weather/consensus.js';
import { sampleFinal } from '../weather/sample.js';
import type { FinalWeather } from '../weather/types.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../../output/preview.png');

/**
 * `npm run preview`
 * Real ob-havoni olishga urinadi; yetarli manba bo'lmasa namunaviy (fixture)
 * ma'lumotdan foydalanadi. `output/preview.png` yaratadi. Telegram ga yubormaydi.
 */
async function main(): Promise<void> {
  const env = getEnv();
  const tz = env.WEATHER_TIMEZONE;
  const useFixture = process.argv.includes('--fixture');

  let final: FinalWeather;
  if (useFixture) {
    logger.info('preview', 'fixture ma‘lumotidan foydalanilmoqda (--fixture)');
    final = sampleFinal(tz);
  } else {
    const sources = await fetchAllSources();
    const consensus = computeConsensus(sources, {
      city: env.WEATHER_CITY,
      date: zonedDateISO(tz),
      minSuccessfulSources: env.MIN_SUCCESSFUL_SOURCES,
    });
    if (consensus.ok) {
      logger.info('preview', `real ob-havo (${consensus.successCount} manba)`);
      final = consensus.final;
    } else {
      logger.warn('preview', `real ma‘lumot yetarli emas (${consensus.reason}); fixture ishlatiladi`);
      final = sampleFinal(tz);
    }
  }

  const png = await renderWeatherCardPng(final, { timezone: tz, updatedAtLabel: '09:00' });
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, png);

  const meta = await sharp(png).metadata();
  logger.info('preview', `saqlandi: ${OUT}`);
  logger.info('preview', `o‘lcham: ${meta.width}×${meta.height}  format: ${meta.format}  ${png.length} bayt`);
}

main().catch((err) => {
  logger.error('preview', errorMessage(err));
  process.exitCode = 1;
});
