import type { WeatherCondition } from './types.js';

export interface SummaryInput {
  condition: WeatherCondition;
  maxTemperatureC: number;
  precipitationProbability: number | null;
  windSpeedKmh: number | null;
}

const HOT_THRESHOLD_C = 33;
const STRONG_WIND_KMH = 30;
const RAIN_CHANCE_PERCENT = 30;

/**
 * Deterministik, qoidaga asoslangan o'zbekcha xulosa (LLM ishlatilmaydi).
 * - maksimal 1–2 qisqa gap
 * - sodda, tabiiy, vahimasiz
 * - kiyim/savdo tavsiyasi bermaydi
 */
export function buildSummaryUz(input: SummaryInput): string {
  const { condition, maxTemperatureC, precipitationProbability, windSpeedKmh } = input;

  let main: string;
  switch (condition) {
    case 'clear':
      main =
        maxTemperatureC >= HOT_THRESHOLD_C
          ? 'Bugun havo ochiq va issiq bo‘ladi.'
          : 'Bugun havo quyoshli va yog‘ingarchiliksiz bo‘ladi.';
      break;
    case 'partly_cloudy':
      main =
        precipitationProbability !== null && precipitationProbability >= RAIN_CHANCE_PERCENT
          ? 'Bugun qisman bulutli, yengil yomg‘ir ehtimoli mavjud.'
          : 'Bugun qisman bulutli, asosan quruq bo‘ladi.';
      break;
    case 'cloudy':
      main = 'Bugun havo bulutli bo‘ladi.';
      break;
    case 'fog':
      main = 'Bugun ertalab tuman kutilmoqda, keyinroq ochilishi mumkin.';
      break;
    case 'drizzle':
      main = 'Bugun mayda yomg‘ir yog‘ishi mumkin.';
      break;
    case 'rain':
      main = 'Bugun yomg‘ir kutilmoqda.';
      break;
    case 'heavy_rain':
      main = 'Bugun kuchli yomg‘ir kutilmoqda.';
      break;
    case 'snow':
      main = 'Bugun qor yog‘ishi mumkin.';
      break;
    case 'thunderstorm':
      main = 'Bugun momaqaldiroqli yomg‘ir kutilmoqda.';
      break;
    case 'unknown':
    default:
      main = 'Bugun ob-havo o‘zgaruvchan bo‘ladi.';
      break;
  }

  // Ikkinchi gap faqat shamol sezilarli bo'lsa (maksimal 2 gap).
  if (windSpeedKmh !== null && windSpeedKmh >= STRONG_WIND_KMH) {
    return `${main} Shamol biroz kuchli bo‘lishi mumkin.`;
  }
  return main;
}
