import { getEnv, requireTelegram } from '../config/env.js';
import { errorMessage, logger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';
import { fetchWithTimeout } from '../utils/timeout.js';

const API = 'https://api.telegram.org';

/** Telegram javobini tekshiradi. Token URL da bo'lgani uchun hech qachon loglamaymiz. */
async function callTelegram(
  method: string,
  botToken: string,
  body: FormData | URLSearchParams,
): Promise<unknown> {
  const env = getEnv();
  const url = `${API}/bot${botToken}/${method}`;
  const res = await fetchWithTimeout(url, { method: 'POST', body }, env.REQUEST_TIMEOUT_MS);
  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; description?: string; error_code?: number }
    | null;
  if (!res.ok || !json?.ok) {
    const desc = json?.description ?? `HTTP ${res.status}`;
    const code = json?.error_code ?? res.status;
    // Telegram 400: chat_id/token/xabar muammosini aniq ko'rsatamiz (tokensiz).
    throw new Error(`Telegram ${method} xato [${code}]: ${desc}`);
  }
  return json;
}

/** Rasm (PNG buffer) ni Telegram guruhiga yuboradi. 3 marta retry qiladi. */
export async function sendPhoto(
  png: Buffer,
  caption = 'Buxoro • Bugungi ob-havo',
): Promise<void> {
  const env = getEnv();
  const { botToken, chatId, adminChatId } = requireTelegram(env);

  try {
    await withRetry(
      async () => {
        const form = new FormData();
        form.set('chat_id', chatId);
        form.set('caption', caption);
        form.set(
          'photo',
          new Blob([new Uint8Array(png)], { type: 'image/png' }),
          'buxoro-ob-havo.png',
        );
        await callTelegram('sendPhoto', botToken, form);
      },
      {
        maxAttempts: 3,
        baseDelayMs: 1000,
        onRetry: (attempt, max, err) =>
          logger.warn('telegram', `sendPhoto muvaffaqiyatsiz ${attempt}/${max}: ${errorMessage(err)}`),
      },
    );
    logger.info('telegram', 'photo sent');
  } catch (err) {
    const msg = errorMessage(err);
    logger.error('telegram', `sendPhoto uzil-kesil muvaffaqiyatsiz: ${msg}`);
    // Admin bo'lsa — matnli ogohlantirishga urinamiz (infinite loop yo'q).
    if (adminChatId) {
      await notifyAdmin(`❗️Ob-havo rasmi yuborilmadi: ${msg}`).catch(() => {
        logger.error('telegram', 'admin xabari ham yuborilmadi');
      });
    }
    throw err;
  }
}

/** Admin/log chatga matnli xabar (ixtiyoriy). Faqat bir marta urinadi. */
export async function notifyAdmin(text: string): Promise<void> {
  const env = getEnv();
  if (!env.TELEGRAM_BOT_TOKEN || !env.ADMIN_CHAT_ID) return;
  const body = new URLSearchParams({ chat_id: env.ADMIN_CHAT_ID, text });
  await callTelegram('sendMessage', env.TELEGRAM_BOT_TOKEN, body);
  logger.info('telegram', 'admin xabari yuborildi');
}
