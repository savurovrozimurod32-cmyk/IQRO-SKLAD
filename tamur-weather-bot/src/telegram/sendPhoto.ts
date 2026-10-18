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

/** Bitta chatga rasm yuboradi (3 marta retry). */
async function sendPhotoToChat(
  botToken: string,
  chatId: string,
  png: Buffer,
  caption: string,
): Promise<void> {
  await withRetry(
    async () => {
      const form = new FormData();
      form.set('chat_id', chatId);
      form.set('caption', caption);
      form.set('photo', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'buxoro-ob-havo.png');
      await callTelegram('sendPhoto', botToken, form);
    },
    {
      maxAttempts: 3,
      baseDelayMs: 1000,
      onRetry: (attempt, max, err) =>
        logger.warn('telegram', `sendPhoto (${chatId}) muvaffaqiyatsiz ${attempt}/${max}: ${errorMessage(err)}`),
    },
  );
}

/**
 * Rasm (PNG buffer) ni Telegram guruh(lar)iga yuboradi.
 * TELEGRAM_CHAT_ID vergul bilan ajratilgan bir nechta guruhni qo'llab-quvvatlaydi
 * (masalan bir vaqtda 2 guruhga). Kamida bittasi muvaffaqiyatli bo'lsa — OK.
 */
export async function sendPhoto(png: Buffer, caption = 'Buxoro • Bugungi ob-havo'): Promise<void> {
  const env = getEnv();
  const { botToken, chatId, adminChatId } = requireTelegram(env);
  const chatIds = chatId.split(',').map((c) => c.trim()).filter(Boolean);

  let ok = 0;
  const errors: string[] = [];
  for (const id of chatIds) {
    try {
      await sendPhotoToChat(botToken, id, png, caption);
      ok++;
      logger.info('telegram', `photo sent (${id})`);
    } catch (err) {
      errors.push(`${id}: ${errorMessage(err)}`);
      logger.error('telegram', `sendPhoto uzil-kesil muvaffaqiyatsiz (${id}): ${errorMessage(err)}`);
    }
  }

  if (ok === 0) {
    const msg = errors.join('; ');
    if (adminChatId) {
      await notifyAdmin(`❗️Ob-havo rasmi yuborilmadi: ${msg}`).catch(() =>
        logger.error('telegram', 'admin xabari ham yuborilmadi'),
      );
    }
    throw new Error(`sendPhoto: hech bir guruhga yuborilmadi (${msg})`);
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
