import type { AppEnv } from './env.js';

const BUXORO_LAT = 39.7747;
const BUXORO_LON = 64.4286;
const COORD_TOLERANCE = 0.05;

function normalizeChatIds(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .sort();
}

/**
 * Production contract guard.
 * Lock yoqilganida muhim Render env qiymatlari tasodifan o'zgarsa job
 * noto'g'ri shahar/guruhga post yuborish o'rniga fail-fast qiladi.
 */
export function assertProductionLock(env: AppEnv): void {
  if (!env.PRODUCTION_LOCK_ENABLED) return;

  const problems: string[] = [];

  if (env.NODE_ENV !== 'production') problems.push('NODE_ENV=production bo‘lishi kerak');
  if (env.WEATHER_CITY.trim().toLowerCase() !== 'buxoro') problems.push('WEATHER_CITY=Buxoro bo‘lishi kerak');
  if (env.WEATHER_TIMEZONE !== 'Asia/Tashkent') problems.push('WEATHER_TIMEZONE=Asia/Tashkent bo‘lishi kerak');
  if (Math.abs(env.WEATHER_LAT - BUXORO_LAT) > COORD_TOLERANCE) problems.push('WEATHER_LAT Buxoro koordinatasidan chetga chiqdi');
  if (Math.abs(env.WEATHER_LON - BUXORO_LON) > COORD_TOLERANCE) problems.push('WEATHER_LON Buxoro koordinatasidan chetga chiqdi');
  if (!env.TELEGRAM_BOT_TOKEN) problems.push('TELEGRAM_BOT_TOKEN bo‘sh');
  if (!env.TELEGRAM_CHAT_ID) problems.push('TELEGRAM_CHAT_ID bo‘sh');

  const actualChats = normalizeChatIds(env.TELEGRAM_CHAT_ID);
  for (const chat of actualChats) {
    if (!/^-100\d+$/.test(chat)) problems.push(`Telegram chat ID formati noto‘g‘ri: ${chat}`);
  }

  // FINAL LOCK: production'da faqat BITTA guruhga yuboriladi.
  if (actualChats.length > 1) {
    problems.push('Production‘da faqat bitta guruh (TELEGRAM_CHAT_ID) ruxsat etiladi');
  }

  const expectedChats = normalizeChatIds(env.PRODUCTION_LOCK_CHAT_IDS);
  if (expectedChats.length === 0) {
    problems.push('PRODUCTION_LOCK_CHAT_IDS sozlanmagan');
  } else if (expectedChats.length > 1) {
    problems.push('PRODUCTION_LOCK_CHAT_IDS faqat bitta guruh bo‘lishi kerak');
  } else if (actualChats.join(',') !== expectedChats.join(',')) {
    problems.push('TELEGRAM_CHAT_ID production lock bilan mos emas');
  }

  if (problems.length > 0) {
    throw new Error(`PRODUCTION LOCK blokladi:\n- ${problems.join('\n- ')}`);
  }
}
