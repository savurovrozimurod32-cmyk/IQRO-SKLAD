import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

/**
 * Env schema. Startupda bir marta validatsiya qilinadi.
 * Telegram qiymatlari ixtiyoriy qilingan — chunki `fetch:test` va `preview`
 * skriptlari Telegram sozlamalarisiz ham ishlashi kerak. Telegram kerak
 * bo'lgan joyda alohida tekshiramiz (`requireTelegram`).
 */
const numericString = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? fallback : Number(v)))
    .pipe(z.number().finite());

const booleanString = (fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') return fallback;
      const n = v.trim().toLowerCase();
      if (['1', 'true', 'yes', 'on'].includes(n)) return true;
      if (['0', 'false', 'no', 'off'].includes(n)) return false;
      return fallback;
    });

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),

  WEATHER_CITY: z.string().default('Buxoro'),
  WEATHER_LAT: numericString(39.7747).pipe(z.number().min(-90).max(90)),
  WEATHER_LON: numericString(64.4286).pipe(z.number().min(-180).max(180)),
  WEATHER_TIMEZONE: z.string().default('Asia/Tashkent'),

  WEATHERAPI_KEY: z.string().optional().default(''),
  MET_USER_AGENT: z
    .string()
    .min(5, 'MET_USER_AGENT bo‘sh bo‘lmasligi kerak (legacy adapter uchun)')
    .default('TamurWeatherBot/1.0 contact@example.com'),

  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_CHAT_ID: z.string().optional().default(''),
  ADMIN_CHAT_ID: z.string().optional().default(''),

  REQUEST_TIMEOUT_MS: numericString(9000).pipe(z.number().int().min(1000).max(60000)),
  REQUEST_MAX_ATTEMPTS: numericString(3).pipe(z.number().int().min(1).max(5)),

  // Production lock: Render'dagi muhim sozlamalar tasodifan o'zgarsa postni bloklaydi.
  PRODUCTION_LOCK_ENABLED: booleanString(false),
  PRODUCTION_LOCK_CHAT_IDS: z.string().optional().default(''),
});

export type AppEnv = z.infer<typeof EnvSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Env validatsiyasi muvaffaqiyatsiz:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Telegram uchun kerakli qiymatlar borligini tekshiradi. */
export function requireTelegram(env: AppEnv): {
  botToken: string;
  chatId: string;
  adminChatId: string | null;
} {
  const missing: string[] = [];
  if (!env.TELEGRAM_BOT_TOKEN) missing.push('TELEGRAM_BOT_TOKEN');
  if (!env.TELEGRAM_CHAT_ID) missing.push('TELEGRAM_CHAT_ID');
  if (missing.length > 0) {
    throw new Error(
      `Telegram sozlanmagan. .env da quyidagilar kerak: ${missing.join(', ')}`,
    );
  }
  return {
    botToken: env.TELEGRAM_BOT_TOKEN,
    chatId: env.TELEGRAM_CHAT_ID,
    adminChatId: env.ADMIN_CHAT_ID || null,
  };
}
