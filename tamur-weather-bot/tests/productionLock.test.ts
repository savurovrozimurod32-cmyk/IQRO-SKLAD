import { describe, expect, it } from 'vitest';
import type { AppEnv } from '../src/config/env.js';
import { assertProductionLock } from '../src/config/productionLock.js';

const base: AppEnv = {
  NODE_ENV: 'production',
  WEATHER_CITY: 'Buxoro',
  WEATHER_LAT: 39.7747,
  WEATHER_LON: 64.4286,
  WEATHER_TIMEZONE: 'Asia/Tashkent',
  WEATHERAPI_KEY: '',
  MET_USER_AGENT: 'TamurWeatherBot/1.0 test@example.com',
  TELEGRAM_BOT_TOKEN: 'test-token',
  TELEGRAM_CHAT_ID: '-1002087046851',
  ADMIN_CHAT_ID: '',
  REQUEST_TIMEOUT_MS: 9000,
  REQUEST_MAX_ATTEMPTS: 3,
  PRODUCTION_LOCK_ENABLED: true,
  PRODUCTION_LOCK_CHAT_IDS: '-1002087046851',
};

describe('production lock', () => {
  it('final production contractni qabul qiladi', () => {
    expect(() => assertProductionLock(base)).not.toThrow();
  });

  it('boshqa Telegram guruhini bloklaydi', () => {
    expect(() => assertProductionLock({ ...base, TELEGRAM_CHAT_ID: '-1001111111111' })).toThrow(/production lock/i);
  });

  it('timezone o‘zgarsa bloklaydi', () => {
    expect(() => assertProductionLock({ ...base, WEATHER_TIMEZONE: 'UTC' })).toThrow(/production lock/i);
  });

  it('lock o‘chirilgan local/dev oqimga xalaqit bermaydi', () => {
    expect(() => assertProductionLock({ ...base, NODE_ENV: 'development', PRODUCTION_LOCK_ENABLED: false })).not.toThrow();
  });
});
