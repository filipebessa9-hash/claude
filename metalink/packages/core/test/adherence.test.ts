import { describe, expect, it } from 'vitest';

import { computeAdherence, defaultToleranceDays, intervalDaysForRoute } from '../src';

const now = new Date(2026, 6, 29, 12, 0, 0); // 29/07/2026
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

describe('intervalDaysForRoute / defaultToleranceDays', () => {
  it('semanal = 7 dias (±1); diário e oral = 1 dia (±0,5)', () => {
    expect(intervalDaysForRoute('weekly_injectable')).toBe(7);
    expect(intervalDaysForRoute('daily_injectable')).toBe(1);
    expect(intervalDaysForRoute('oral')).toBe(1);
    expect(defaultToleranceDays(7)).toBe(1);
    expect(defaultToleranceDays(1)).toBe(0.5);
  });
});

describe('computeAdherence', () => {
  it('retorna null sem doses no período', () => {
    expect(computeAdherence([], { intervalDays: 7, now })).toBeNull();
    expect(computeAdherence([daysAgo(120)], { intervalDays: 7, now, periodDays: 90 })).toBeNull();
  });

  it('aderência perfeita semanal: 4 doses a cada 7 dias', () => {
    const doses = [daysAgo(21), daysAgo(14), daysAgo(7), daysAgo(0)];
    const summary = computeAdherence(doses, { intervalDays: 7, now })!;
    expect(summary.expected).toBe(4);
    expect(summary.taken).toBe(4);
    expect(summary.adherencePct).toBe(100);
    expect(summary.currentGapSlots).toBe(0);
  });

  it('dose dentro da tolerância conta como no horário', () => {
    // Terceira dose com 1 dia de atraso (tolerância semanal = ±1 dia).
    const doses = [daysAgo(21), daysAgo(14), daysAgo(6)];
    const summary = computeAdherence(doses, { intervalDays: 7, now })!;
    expect(summary.expected).toBe(4);
    expect(summary.taken).toBe(3);
    expect(summary.adherencePct).toBe(75);
  });

  it('dose fora da tolerância não conta para o slot', () => {
    // Segunda dose 3 dias atrasada: slot 7d fica vazio.
    const doses = [daysAgo(14), daysAgo(4)];
    const summary = computeAdherence(doses, { intervalDays: 7, now, toleranceDays: 1 })!;
    expect(summary.expected).toBe(3);
    expect(summary.taken).toBe(1);
  });

  it('conta doses esperadas seguidas sem registro no fim do período', () => {
    // Última dose há 21 dias: slots de 14, 7 e 0 dias atrás vazios.
    const doses = [daysAgo(35), daysAgo(28), daysAgo(21)];
    const summary = computeAdherence(doses, { intervalDays: 7, now })!;
    expect(summary.expected).toBe(6);
    expect(summary.taken).toBe(3);
    expect(summary.currentGapSlots).toBe(3);
    expect(summary.lastDoseAt.getTime()).toBe(daysAgo(21).getTime());
  });

  it('esquema diário funciona com tolerância de meio dia', () => {
    const doses = [daysAgo(3), daysAgo(2), daysAgo(0)];
    const summary = computeAdherence(doses, { intervalDays: 1, now })!;
    expect(summary.expected).toBe(4);
    expect(summary.taken).toBe(3);
    expect(summary.currentGapSlots).toBe(0);
  });
});
