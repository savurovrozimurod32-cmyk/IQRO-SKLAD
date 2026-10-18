import { getEnv } from '../config/env.js';
import { logger, errorMessage } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';
import { fetchWithTimeout } from '../utils/timeout.js';

/**
 * Provider uchun JSON GET — timeout + retry (eksponensial) + strukturaviy log.
 * Bir providerning xatosi boshqalarga ta'sir qilmaydi (chaqiruvchi
 * `Promise.allSettled` bilan izolatsiya qiladi).
 */
export async function fetchJson<T>(
  scope: string,
  url: string,
  headers: Record<string, string> = {},
): Promise<T> {
  const env = getEnv();
  const started = Date.now();

  const result = await withRetry(
    async () => {
      const res = await fetchWithTimeout(
        url,
        { headers: { Accept: 'application/json', ...headers } },
        env.REQUEST_TIMEOUT_MS,
      );
      if (!res.ok) {
        // 4xx/5xx — statusni aniq beramiz, keyingi retry qaror qiladi
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText} ${body.slice(0, 120)}`.trim());
      }
      return (await res.json()) as T;
    },
    {
      maxAttempts: env.REQUEST_MAX_ATTEMPTS,
      baseDelayMs: 1000,
      onRetry: (attempt, max, err) => {
        logger.warn(
          scope,
          `request failed attempt ${attempt}/${max}: ${errorMessage(err)}`,
        );
      },
    },
  );

  logger.info(scope, `success ${Date.now() - started}ms`);
  return result;
}
