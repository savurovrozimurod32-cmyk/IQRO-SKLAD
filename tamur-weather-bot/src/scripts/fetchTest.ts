import { getEnv } from '../config/env.js';
import { fetchAllSources, successCount } from '../sources/index.js';
import { logger } from '../utils/logger.js';
import { SOURCE_DISPLAY_NAME } from '../weather/types.js';

/**
 * `npm run fetch:test`
 * 3 providerdan ma'lumot olib, har birining normalize natijasini
 * ALOHIDA console'da ko'rsatadi. Telegram ga hech narsa yubormaydi.
 */
async function main(): Promise<void> {
  const env = getEnv();
  logger.info('fetch:test', `Hudud: ${env.WEATHER_CITY} (${env.WEATHER_LAT}, ${env.WEATHER_LON})`);

  const sources = await fetchAllSources(env.WEATHER_TIMEZONE);

  for (const s of sources) {
    const name = SOURCE_DISPLAY_NAME[s.source] ?? s.source;
    console.log(`\n── ${name} ${s.success ? '✅' : '❌'} ──`);
    if (!s.success) {
      console.log(`   error: ${s.error}`);
      continue;
    }
    console.log(`   current: ${s.currentTemperatureC}°C  min: ${s.minTemperatureC}°C  max: ${s.maxTemperatureC}°C`);
    console.log(`   condition: ${s.condition}`);
    console.log(`   rain: ${s.precipitationProbability}%  (${s.precipitationMm} mm)`);
    console.log(`   wind: ${s.windSpeedKmh} km/soat  gust: ${s.windGustKmh}`);
    console.log(`   humidity: ${s.humidityPercent}%`);
  }

  console.log(`\n════════ NATIJA ════════`);
  console.log(`ishlagan manbalar: ${successCount(sources)}/${sources.length}`);
  console.log('(consensus yo‘q — har manba rasmda alohida karta bo‘lib chiqadi)');
}

main().catch((err) => {
  logger.error('fetch:test', String(err));
  process.exitCode = 1;
});
