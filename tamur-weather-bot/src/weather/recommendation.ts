import { weekdayFullUz } from '../utils/datetime.js';
import { isNum } from './normalize.js';
import type { ForecastDay, WeatherCondition } from './types.js';

/**
 * Savdo uchun qulaylik — DETERMINISTIC (LLM YO'Q).
 * Har kun uchun ob-havoga asoslangan ball hisoblanadi.
 */
// Quyoshli kunlar plus; quyosh bo'lmagan kunlar salqin/sust deb baholanadi.
const CONDITION_SCORE: Record<WeatherCondition, number> = {
  clear: 4, // quyoshli — eng qulay
  partly_cloudy: 1, // biroz quyosh bor
  cloudy: -1, // quyosh yo'q -> salqin/sust
  fog: -2,
  drizzle: -3,
  rain: -4,
  snow: -5,
  heavy_rain: -6,
  thunderstorm: -7,
  unknown: -1, // ma'lumot yo'q -> ehtiyotkor
};

export function scoreDay(day: ForecastDay): number {
  let score = CONDITION_SCORE[day.condition] ?? 0;

  // Harorat: mo'tadil (24–35) plus, ekstremal minus
  const t = day.maxTempC;
  if (isNum(t)) {
    if (t >= 24 && t <= 35) score += 2;
    else if (t >= 36 && t <= 38) score += 0;
    else if (t >= 39) score -= 3;
    else if (t < 10) score -= 3;
    else score += 1; // 10–23 salqin, lekin yomon emas
  }

  // Yog'ingarchilik ehtimoli
  const p = day.precipitationProbability;
  if (isNum(p)) {
    if (p >= 60) score -= 3;
    else if (p >= 40) score -= 1;
  }

  // Shamol
  const w = day.windKmh;
  if (isNum(w)) {
    if (w >= 40) score -= 2;
    else if (w >= 30) score -= 1;
  }

  return score;
}

export interface Recommendation {
  bestDate: string;
  worstDate: string;
  lines: string[]; // rasmga chiqadigan qisqa matn(lar)
}

/**
 * Eng qulay (savdo) va eng sust kunni topib, menejer uchun qisqa tavsiya beradi.
 * Bir yoki ikki qisqa qator — keraksiz uzun matn yo'q.
 */
export function buildRecommendation(days: ForecastDay[], timezone: string): Recommendation | null {
  if (days.length === 0) return null;

  const scored = days.map((d) => ({ day: d, score: scoreDay(d) }));
  const best = scored.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = scored.reduce((a, b) => (b.score < a.score ? b : a));

  const bestName = weekdayFullUz(best.day.date, timezone);
  const lines: string[] = [];

  if (best.score >= 4) {
    lines.push(`${bestName} — savdo uchun qulay kun. Bu kuni hech kimga javob berilmaydi.`);
  } else if (best.score >= 1) {
    lines.push(`${bestName} — savdo o‘rtacha bo‘lishi mumkin. Xodimlarga javob berishda ehtiyot bo‘ling.`);
  } else {
    lines.push(`${bestName} — bu hafta quyoshli kun kam, savdo sust bo‘lishi mumkin. Rejani ehtiyotkorlik bilan tuzing.`);
  }

  // Sust kun boshqa bo'lsa va sezilarli farq bo'lsa — ikkinchi qator
  if (worst.day.date !== best.day.date && best.score - worst.score >= 3) {
    const worstName = weekdayFullUz(worst.day.date, timezone);
    lines.push(`${worstName} — savdo sust bo‘lishi mumkin. Zarurat bo‘lsa 1 xodimga javob berish mumkin.`);
  }

  return { bestDate: best.day.date, worstDate: worst.day.date, lines };
}
