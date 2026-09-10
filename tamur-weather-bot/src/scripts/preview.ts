import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { getEnv } from '../config/env.js';
import { renderWeatherCardPng } from '../design/renderWeatherCard.js';
import { fetchAllSources, successCount } from '../sources/index.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage, logger } from '../utils/logger.js';
import { orderedSample, withFailures } from '../weather/sample.js';
import type { WeatherSourceResult } from '../weather/types.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../../output');

/**
 * `npm run preview`
 * Real ob-havoni olishga urinadi; olinmasa namunaviy (fixture) ma'lumot.
 * `output/preview.png` yaratadi. Telegram ga yubormaydi.
 *
 * Qo'shimcha variantlar (fixture) failure holatlarini ham chizadi:
 *   --variants  ->  output/preview-3of3.png, preview-2of3.png, preview-1of3.png
 */
async function main(): Promise<void> {
  const env = getEnv();
  const tz = env.WEATHER_TIMEZONE;
  const date = zonedDateISO(tz);
  await mkdir(OUT_DIR, { recursive: true });

  const save = async (sources: WeatherSourceResult[], file: string): Promise<void> => {
    // updatedAtLabel berilmaydi -> renderer real Asia/Tashkent vaqtini ishlatadi.
    const png = await renderWeatherCardPng(sources, {
      city: env.WEATHER_CITY,
      date,
      timezone: tz,
    });
    const out = resolve(OUT_DIR, file);
    await writeFile(out, png);
    const meta = await sharp(png).metadata();
    logger.info('preview', `${file}: ${meta.width}×${meta.height} ${meta.format} ${png.length} bayt`);
  };

  if (process.argv.includes('--variants')) {
    const base = orderedSample(tz);
    await save(base, 'preview-3of3.png');
    await save(withFailures(base, ['weatherapi']), 'preview-2of3.png');
    await save(withFailures(base, ['met-norway', 'weatherapi']), 'preview-1of3.png');
    logger.info('preview', 'variantlar yaratildi (output/preview-*of3.png)');
    return;
  }

  const useFixture = process.argv.includes('--fixture');
  let sources: WeatherSourceResult[];
  if (useFixture) {
    logger.info('preview', 'fixture ma‘lumotidan foydalanilmoqda (--fixture)');
    sources = orderedSample(tz);
  } else {
    sources = await fetchAllSources(tz);
    const ok = successCount(sources);
    // Yangi qoida: kamida 1 manba ishlasa real preview chiziladi.
    if (ok >= 1) {
      logger.info('preview', `real ob-havo (${ok}/${sources.length} manba)`);
    } else {
      logger.warn('preview', `real manba yo‘q (0/${sources.length}); fixture ishlatiladi`);
      sources = orderedSample(tz);
    }
  }

  await save(sources, 'preview.png');
  logger.info('preview', `saqlandi: ${resolve(OUT_DIR, 'preview.png')}`);
}

main().catch((err) => {
  logger.error('preview', errorMessage(err));
  process.exitCode = 1;
});
