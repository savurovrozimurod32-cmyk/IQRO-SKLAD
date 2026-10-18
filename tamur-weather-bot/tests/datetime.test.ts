import { describe, expect, it } from 'vitest';
import { formatUzDate, zonedDateISO, zonedParts } from '../src/utils/datetime.js';

const TZ = 'Asia/Tashkent';

describe('timezone — server UTC bo‘lsa ham Buxoro sanasi to‘g‘ri', () => {
  it('UTC 23:00 (kech) -> Buxoro allaqachon ertangi kun', () => {
    // 2026-09-09T23:00:00Z, Asia/Tashkent (+5) => 2026-09-10T04:00 local
    const at = new Date('2026-09-09T23:00:00Z');
    expect(zonedDateISO(TZ, at)).toBe('2026-09-10');
    expect(zonedParts(TZ, at).hour).toBe(4);
  });

  it('UTC 03:00 -> hali o‘sha kun (Buxoro 08:00)', () => {
    const at = new Date('2026-09-09T03:00:00Z');
    expect(zonedDateISO(TZ, at)).toBe('2026-09-09');
    expect(zonedParts(TZ, at).hour).toBe(8);
  });
});

describe('formatUzDate', () => {
  it('o‘zbekcha oy va hafta kuni', () => {
    // 2026-09-10 -> Payshanba (Thursday)
    expect(formatUzDate('2026-09-10', TZ)).toBe('10 Sentabr • Payshanba');
  });
});
