import { severity } from './conditions.js';
import { clampPercent, isNum, median, round, roundTemp } from './normalize.js';
import { buildSummaryUz } from './summary.js';
import type {
  FinalWeather,
  WeatherCondition,
  WeatherSourceResult,
} from './types.js';

export interface ConsensusOk {
  ok: true;
  final: FinalWeather;
  successCount: number;
}
export interface ConsensusBlocked {
  ok: false;
  reason: string;
  successCount: number;
}
export type ConsensusResult = ConsensusOk | ConsensusBlocked;

export interface ConsensusOptions {
  city: string;
  date: string; // "YYYY-MM-DD"
  minSuccessfulSources: number;
}

const WET_MM = 0.5;
const WET_PROB = 50;

/**
 * Holat (condition) bo'yicha ovoz berish:
 *  - ko'pchilik (plurality) g'olib bo'lsa — o'sha.
 *  - teng bo'lsa — precipitation signali + jiddiylik darajasi bilan hal qilamiz
 *    (ko'r-ko'rona faqat priority tanlamaymiz).
 */
export function conditionConsensus(
  conditions: WeatherCondition[],
  medianProb: number | null,
  medianMm: number | null,
): WeatherCondition {
  const votes = conditions.filter((c) => c !== 'unknown');
  if (votes.length === 0) return 'unknown';

  const counts = new Map<WeatherCondition, number>();
  for (const c of votes) counts.set(c, (counts.get(c) ?? 0) + 1);

  const maxCount = Math.max(...counts.values());
  const candidates = [...counts.entries()]
    .filter(([, n]) => n === maxCount)
    .map(([c]) => c);

  if (candidates.length === 1) return candidates[0] as WeatherCondition;

  // Teng ovoz — precipitation signaliga qaraymiz.
  const wet =
    (isNum(medianMm) && medianMm >= WET_MM) || (isNum(medianProb) && medianProb >= WET_PROB);

  const bySeverityDesc = (a: WeatherCondition, b: WeatherCondition) =>
    severity(b) - severity(a);

  if (wet) {
    // Yog'ingarchilik bor — eng jiddiy nomzodni tanlaymiz.
    return [...candidates].sort(bySeverityDesc)[0] as WeatherCondition;
  }

  // Quruq/noaniq — yomg'irni ortiqcha ko'rsatmaymiz.
  // Quruq nomzodlar (rain'dan past) ichidan eng ko'zga ko'rinadiganini,
  // ular bo'lmasa — eng yengil "ho'l" holatni tanlaymiz.
  const dry = candidates.filter((c) => severity(c) < severity('rain'));
  if (dry.length > 0) return [...dry].sort(bySeverityDesc)[0] as WeatherCondition;
  return [...candidates].sort((a, b) => severity(a) - severity(b))[0] as WeatherCondition;
}

/**
 * 3 (yoki 2) provider natijasidan bitta yakuniy ob-havo obyekti.
 * Sonli qiymatlar uchun MEDIAN (outlierlarga chidamli).
 * Muvaffaqiyatli manbalar soni thresholddan kam bo'lsa — bloklanadi.
 */
export function computeConsensus(
  sources: WeatherSourceResult[],
  options: ConsensusOptions,
): ConsensusResult {
  const ok = sources.filter((s) => s.success);
  const successCount = ok.length;

  if (successCount < options.minSuccessfulSources) {
    return {
      ok: false,
      successCount,
      reason: `Yetarli manba yo‘q: ${successCount}/${sources.length} muvaffaqiyatli (kamida ${options.minSuccessfulSources} kerak)`,
    };
  }

  const medianProb = clampPercent(median(ok.map((s) => s.precipitationProbability)));
  const medianMm = median(ok.map((s) => s.precipitationMm));

  // Temperaturalar — median, keyin xavfsiz fallback zanjiri.
  const medCurrent = median(ok.map((s) => s.currentTemperatureC));
  const medMin = median(ok.map((s) => s.minTemperatureC));
  const medMax = median(ok.map((s) => s.maxTemperatureC));

  let maxT = medMax ?? medCurrent ?? medMin;
  let minT = medMin ?? medCurrent ?? maxT;
  let curT = medCurrent ?? maxT ?? minT;

  if (!isNum(curT) || !isNum(minT) || !isNum(maxT)) {
    return {
      ok: false,
      successCount,
      reason: 'Temperatura ma‘lumoti yetarli emas',
    };
  }

  // min <= max kafolati
  if (minT > maxT) [minT, maxT] = [maxT, minT];
  // current ni [min, max] oralig'ida ushlaymiz (mantiqiylik uchun)
  curT = Math.min(maxT, Math.max(minT, curT));

  const condition = conditionConsensus(
    ok.map((s) => s.condition),
    medianProb,
    medianMm,
  );

  const windSpeedKmh = median(ok.map((s) => s.windSpeedKmh));
  const windGustKmh = median(ok.map((s) => s.windGustKmh));
  const humidityPercent = clampPercent(median(ok.map((s) => s.humidityPercent)));

  const maxTemperatureC = roundTemp(maxT);
  const summaryUz = buildSummaryUz({
    condition,
    maxTemperatureC,
    precipitationProbability: medianProb,
    windSpeedKmh: isNum(windSpeedKmh) ? windSpeedKmh : null,
  });

  const final: FinalWeather = {
    city: options.city,
    date: options.date,
    currentTemperatureC: roundTemp(curT),
    minTemperatureC: roundTemp(minT),
    maxTemperatureC,
    condition,
    precipitationProbability: medianProb,
    precipitationMm: isNum(medianMm) ? round(medianMm, 1) : null,
    windSpeedKmh: isNum(windSpeedKmh) ? Math.round(windSpeedKmh) : null,
    windGustKmh: isNum(windGustKmh) ? Math.round(windGustKmh) : null,
    humidityPercent,
    summaryUz,
    sourceCount: successCount,
    generatedAt: new Date().toISOString(),
  };

  return { ok: true, final, successCount };
}
