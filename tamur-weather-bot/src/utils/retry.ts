import { sleep } from './timeout.js';

export interface RetryOptions {
  /** Maksimal urinishlar soni (birinchi urinish ham shunga kiradi). */
  maxAttempts: number;
  /** Backoff bazasi (ms). Kutish: base * 2^(attempt-1). */
  baseDelayMs?: number;
  /** Har bir muvaffaqiyatsiz urinishda chaqiriladi (log uchun). */
  onRetry?: (attempt: number, maxAttempts: number, err: unknown) => void;
}

/**
 * Berilgan funksiyani muvaffaqiyatsizlikda eksponensial backoff bilan qayta urinadi.
 *   1-urinish fail -> ~ base ms kutadi
 *   2-urinish fail -> ~ base*2 ms kutadi
 * Barcha urinishlar tugasa oxirgi xatolikni tashlaydi.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { maxAttempts, baseDelayMs = 1000, onRetry } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        onRetry?.(attempt, maxAttempts, err);
        const delay = baseDelayMs * 2 ** (attempt - 1);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}
