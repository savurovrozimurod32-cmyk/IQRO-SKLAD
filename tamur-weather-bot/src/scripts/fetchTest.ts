import { getEnv } from '../config/env.js';
import { fetchHourlySources, successCount } from '../sources/index.js';
import { logger } from '../utils/logger.js';
import { SOURCE_DISPLAY_NAME } from '../weather/types.js';

/**
 * `npm run fetch:test`
 * 2 manbadan bugungi SOATBAY prognozni olib, har birini ALOHIDA ko'rsatadi.
 * Telegram ga hech narsa yubormaydi.
 */
async function main(): Promise<void> {
  const env = getEnv();
  logger.info('fetch:test', `Hudud: ${env.WEATHER_CITY} (${env.WEATHER_LAT}, ${env.WEATHER_LON})`);

  const sources = await fetchHourlySources(env.WEATHER_TIMEZONE);

  for (const s of sources) {
    const name = SOURCE_DISPLAY_NAME[s.source] ?? s.source;
    console.log(`\n── ${name} ${s.success ? '✅' : '❌'} (${s.hourly.length} soat) ──`);
    if (!s.success) {
      console.log(`   error: ${s.error}`);
      continue;
    }
    for (const p of s.hourly) {
      const rain = p.precipitationProbability === null ? '—' : `${p.precipitationProbability}%`;
      const wind = p.windSpeedKmh === null ? '—' : `${p.windSpeedKmh} km/soat`;
      console.log(`   ${p.time}  ${p.temperatureC ?? '—'}°  ${p.condition}  yomg‘ir:${rain}  shamol:${wind}`);
    }
  }

  console.log(`\n════════ NATIJA ════════`);
  console.log(`ishlagan manbalar: ${successCount(sources)}/${sources.length}`);
  console.log('(consensus yo‘q — har manba rasmda alohida ustun bo‘lib chiqadi)');
}

main().catch((err) => {
  logger.error('fetch:test', String(err));
  process.exitCode = 1;
});
