import { getEnv } from '../config/env.js';
import { errorMessage, logger } from '../utils/logger.js';
import { fetchWithTimeout } from '../utils/timeout.js';

/**
 * `npm run telegram:updates`
 * Bot `getUpdates` natijasidan chat ma'lumotlarini (title, id, type) chiqaradi.
 * Guruh chat ID sini topish uchun ishlatiladi. Bot token stdout ga chiqmaydi.
 *
 * Ishlatish:
 *   1. Botni guruhga qo'shing.
 *   2. Guruhga bitta xabar yozing (yoki botni admin qiling).
 *   3. Shu skriptni ishga tushiring.
 */
async function main(): Promise<void> {
  const env = getEnv();
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error('.env da TELEGRAM_BOT_TOKEN yo‘q.');
  }

  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates`;
  const res = await fetchWithTimeout(url, {}, env.REQUEST_TIMEOUT_MS);
  const json = (await res.json()) as {
    ok: boolean;
    description?: string;
    result?: Array<{ message?: { chat?: Chat }; my_chat_member?: { chat?: Chat } }>;
  };

  if (!json.ok) {
    throw new Error(`getUpdates xato: ${json.description ?? res.status}`);
  }

  const updates = json.result ?? [];
  if (updates.length === 0) {
    logger.warn('telegram:updates', 'Hech qanday update yo‘q. Botni guruhga qo‘shib, guruhga xabar yozing.');
    return;
  }

  const seen = new Map<number, Chat>();
  for (const u of updates) {
    const chat = u.message?.chat ?? u.my_chat_member?.chat;
    if (chat && !seen.has(chat.id)) seen.set(chat.id, chat);
  }

  console.log('\n── Topilgan chatlar ──');
  for (const chat of seen.values()) {
    console.log(`  type:  ${chat.type}`);
    console.log(`  title: ${chat.title ?? chat.first_name ?? '(shaxsiy)'}`);
    console.log(`  id:    ${chat.id}`);
    console.log('  ─────');
  }
  console.log('Guruh uchun "type: group/supergroup" bo‘lgan id ni TELEGRAM_CHAT_ID ga yozing.');
}

interface Chat {
  id: number;
  type: string;
  title?: string;
  first_name?: string;
}

main().catch((err) => {
  logger.error('telegram:updates', errorMessage(err));
  process.exitCode = 1;
});
