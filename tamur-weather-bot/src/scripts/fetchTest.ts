import { getEnv } from '../config/env.js';
import { fetchAllSources } from '../sources/index.js';
import { zonedDateISO } from '../utils/datetime.js';
import { logger } from '../utils/logger.js';
import { computeConsensus } from '../weather/consensus.js';

/**
 * `npm run fetch:test`
 * 3 providerdan ma'lumot olib, normalize natijalarni va consensusni
 * console'da ko'rsatadi. Telegram ga hech narsa yubormaydi.
 */
async function main(): Promise<void> {
  const env = getEnv();
  logger.info('fetch:test', `Hudud: ${env.WEATHER_CITY} (${env.WEATHER_LAT}, ${env.WEATHER_LON})`);

  const sources = await fetchAllSources();

  for (const s of sources) {
    console.log(`\n── ${s.source} ${s.success ? '✅' : '❌'} ──`);
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

  const consensus = computeConsensus(sources, {
    city: env.WEATHER_CITY,
    date: zonedDateISO(env.WEATHER_TIMEZONE),
    minSuccessfulSources: env.MIN_SUCCESSFUL_SOURCES,
  });

  console.log('\n════════ CONSENSUS ════════');
  console.log(`sources: ${consensus.successCount}/${sources.length}`);
  if (consensus.ok) {
    console.log(JSON.stringify(consensus.final, null, 2));
  } else {
    console.log(`BLOKLANDI: ${consensus.reason}`);
  }
}

main().catch((err) => {
  logger.error('fetch:test', String(err));
  process.exitCode = 1;
});
