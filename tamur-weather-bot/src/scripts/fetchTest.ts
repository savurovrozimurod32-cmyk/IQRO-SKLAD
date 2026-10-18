import { getEnv } from '../config/env.js';
import { getDailySummary, getWeeklyForecast } from '../sources/index.js';
import { weekdayShortUz } from '../utils/datetime.js';
import { logger } from '../utils/logger.js';
import { buildRecommendation } from '../weather/recommendation.js';

/**
 * `npm run fetch:test`
 * Kunlik xulosa + 10 kunlik forecast + menejer tavsiyasini console'da ko'rsatadi.
 * Telegram ga hech narsa yubormaydi.
 */
async function main(): Promise<void> {
  const env = getEnv();
  const tz = env.WEATHER_TIMEZONE;
  logger.info('fetch:test', `Hudud: ${env.WEATHER_CITY} (${env.WEATHER_LAT}, ${env.WEATHER_LON})`);

  const [daily, weekly] = await Promise.all([getDailySummary(), getWeeklyForecast()]);

  console.log(`\n── KUNLIK ${daily.success ? '✅' : '❌'} ──`);
  if (daily.success) {
    console.log(`   ${daily.date}  ${daily.condition}  max:${daily.maxTempC}° min:${daily.minTempC}°`);
    console.log(`   namlik:${daily.humidityPercent}%  shamol:${daily.windKmh}km/soat  bosim:${daily.pressureMb}mb`);
    console.log(`   oy:${daily.moonPhaseUz}  quyosh:${daily.sunrise}–${daily.sunset}`);
    console.log(`   tong:${daily.morningTempC}° kun:${daily.dayTempC}° oqshom:${daily.eveningTempC}°`);
  } else console.log(`   error: ${daily.error}`);

  console.log(`\n── 10 KUNLIK ${weekly.success ? '✅' : '❌'} (${weekly.days.length} kun) ──`);
  for (const d of weekly.days) {
    console.log(`   ${d.date} ${weekdayShortUz(d.date, tz)}  ${d.condition}  ${d.maxTempC}°/${d.minTempC}°  yomg‘ir:${d.precipitationProbability ?? '—'}%`);
  }

  const rec = buildRecommendation(weekly.days, tz);
  console.log(`\n── MENEJER TAVSIYASI ──`);
  if (rec) rec.lines.forEach((l) => console.log(`   ${l}`));
  else console.log('   (ma’lumot yetarli emas)');
}

main().catch((err) => {
  logger.error('fetch:test', String(err));
  process.exitCode = 1;
});
