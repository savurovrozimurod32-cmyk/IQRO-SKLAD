import { describe, expect, it } from 'vitest';
import { buildSummaryUz } from '../src/weather/summary.js';

describe('buildSummaryUz', () => {
  it('quyoshli (issiq emas)', () => {
    const s = buildSummaryUz({ condition: 'clear', maxTemperatureC: 28, precipitationProbability: 0, windSpeedKmh: 8 });
    expect(s).toContain('quyoshli');
    expect(s).not.toContain('yomg‘ir');
  });

  it('quyoshli + issiq', () => {
    const s = buildSummaryUz({ condition: 'clear', maxTemperatureC: 38, precipitationProbability: 0, windSpeedKmh: 8 });
    expect(s).toContain('issiq');
  });

  it('yomg‘ir uchun yomg‘irli xulosa', () => {
    const s = buildSummaryUz({ condition: 'rain', maxTemperatureC: 22, precipitationProbability: 80, windSpeedKmh: 10 });
    expect(s).toContain('yomg‘ir');
  });

  it('kuchli shamol ikkinchi gap qo‘shadi (maks 2 gap)', () => {
    const s = buildSummaryUz({ condition: 'rain', maxTemperatureC: 20, precipitationProbability: 70, windSpeedKmh: 35 });
    expect(s).toContain('Shamol');
    expect(s.split('.').filter((p) => p.trim().length > 0).length).toBeLessThanOrEqual(2);
  });

  it('past shamolda ikkinchi gap yo‘q', () => {
    const s = buildSummaryUz({ condition: 'clear', maxTemperatureC: 25, precipitationProbability: 0, windSpeedKmh: 5 });
    expect(s).not.toContain('Shamol');
  });
});
