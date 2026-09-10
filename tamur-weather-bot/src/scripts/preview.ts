import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { getEnv } from '../config/env.js';
import { renderHourlyCardPng } from '../design/renderHourlyCard.js';
import { fetchHourlySources, successCount } from '../sources/index.js';
import { zonedDateISO } from '../utils/datetime.js';
import { errorMessage, logger } from '../utils/logger.js';
import { orderedHourlySample, withHourlyFailures } from '../weather/hourlySample.js';
import type { HourlySourceResult } from '../weather/types.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../../output');

/**
 * `npm run preview`
 * Real soatbay ob-havoni olishga urinadi; olinmasa (0/2) namunaviy data.
 * `output/preview.png` yaratadi. Telegram ga yubormaydi.
 *   --fixture   -> doim namunaviy data
 *   --variants  -> output/preview-2of2.png, preview-1of2.png
 */
async function main(): Promise<void> {
  const env = getEnv();
  const tz = env.WEATHER_TIMEZONE;
  const date = zonedDateISO(tz);
  await mkdir(OUT_DIR, { recursive: true });

  const save = async (sources: HourlySourceResult[], file: string): Promise<void> => {
    // updatedAtLabel berilmaydi -> real Asia/Tashkent vaqti ishlatiladi.
    const png = await renderHourlyCardPng(sources, { city: env.WEATHER_CITY, date, timezone: tz });
    const out = resolve(OUT_DIR, file);
    await writeFile(out, png);
    const meta = await sharp(png).metadata();
    logger.info('preview', `${file}: ${meta.width}×${meta.height} ${meta.format} ${png.length} bayt`);
  };

  if (process.argv.includes('--variants')) {
    const base = orderedHourlySample(tz);
    await save(base, 'preview-2of2.png');
    await save(withHourlyFailures(base, ['weatherapi']), 'preview-1of2.png');
    logger.info('preview', 'variantlar yaratildi (output/preview-*of2.png)');
    return;
  }

  let sources: HourlySourceResult[];
  if (process.argv.includes('--fixture')) {
    logger.info('preview', 'fixture ma‘lumotidan foydalanilmoqda (--fixture)');
    sources = orderedHourlySample(tz);
  } else {
    sources = await fetchHourlySources(tz);
    const ok = successCount(sources);
    if (ok >= 1) {
      logger.info('preview', `real soatbay ob-havo (${ok}/${sources.length} manba)`);
    } else {
      logger.warn('preview', `real manba yo‘q (0/${sources.length}); fixture ishlatiladi`);
      sources = orderedHourlySample(tz);
    }
  }

  await save(sources, 'preview.png');
  logger.info('preview', `saqlandi: ${resolve(OUT_DIR, 'preview.png')}`);
}

main().catch((err) => {
  logger.error('preview', errorMessage(err));
  process.exitCode = 1;
});
