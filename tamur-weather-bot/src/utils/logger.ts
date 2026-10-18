/**
 * Juda sodda strukturaviy logger.
 * Format: [scope] message  (+ ixtiyoriy qo'shimcha ma'lumot)
 *
 * Sirlar (token/key) hech qachon logga chiqmasligi kerak — chaqiruvchi
 * kod hech qachon token/keyni bu yerga uzatmasligi lozim.
 */

type LogLevel = 'info' | 'warn' | 'error';

function ts(): string {
  return new Date().toISOString();
}

function line(level: LogLevel, scope: string, message: string): string {
  const prefix = level === 'info' ? '' : level === 'warn' ? 'WARN ' : 'ERROR ';
  return `${ts()} [${scope}] ${prefix}${message}`;
}

export const logger = {
  info(scope: string, message: string): void {
    console.log(line('info', scope, message));
  },
  warn(scope: string, message: string): void {
    console.warn(line('warn', scope, message));
  },
  error(scope: string, message: string): void {
    console.error(line('error', scope, message));
  },
};

/** Xatolikni xavfsiz, qisqa matnga aylantiradi (payloadni spam qilmaydi). */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err).slice(0, 200);
  } catch {
    return String(err);
  }
}
