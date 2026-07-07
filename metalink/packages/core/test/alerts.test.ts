import { describe, expect, it } from 'vitest';

import { buildAlertFlags, type AlertInputs, type SymptomEvent } from '../src';

const now = new Date(2026, 6, 29, 12, 0, 0);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

const baseInput: AlertInputs = {
  weightSummary: null,
  symptoms: [],
  adherence: null,
  now,
};

describe('buildAlertFlags', () => {
  it('sem dados, sem flags', () => {
    expect(buildAlertFlags(baseInput)).toEqual([]);
  });

  it('sinaliza perda de peso acelerada (≥4% em 30 dias)', () => {
    const flags = buildAlertFlags({
      ...baseInput,
      weightSummary: { latestKg: 90, totalChangeKg: -5, change30dKg: -4 },
    });
    expect(flags.map((f) => f.type)).toEqual(['rapid_weight_loss']);
    expect(flags[0]!.detail).toContain('4 kg');
  });

  it('não sinaliza perda dentro do esperado', () => {
    const flags = buildAlertFlags({
      ...baseInput,
      weightSummary: { latestKg: 90, totalChangeKg: -2, change30dKg: -2 },
    });
    expect(flags).toEqual([]);
  });

  it('sinaliza ganho de peso inesperado (≥3% em 30 dias)', () => {
    const flags = buildAlertFlags({
      ...baseInput,
      weightSummary: { latestKg: 90, totalChangeKg: 3, change30dKg: 3 },
    });
    expect(flags.map((f) => f.type)).toEqual(['weight_gain']);
  });

  it('sinaliza sintomas intensos com os tipos em pt-BR', () => {
    const symptoms: SymptomEvent[] = [
      { symptom: 'abdominal_pain', severity: 'severe', occurredAt: daysAgo(2) },
      { symptom: 'nausea', severity: 'mild', occurredAt: daysAgo(1) },
    ];
    const flags = buildAlertFlags({ ...baseInput, symptoms });
    expect(flags.map((f) => f.type)).toEqual(['severe_symptoms']);
    expect(flags[0]!.detail).toContain('Dor abdominal');
  });

  it('sinaliza vômitos recorrentes: 3+ na última semana', () => {
    const vomit = (d: number): SymptomEvent => ({
      symptom: 'vomiting',
      severity: 'moderate',
      occurredAt: daysAgo(d),
    });
    const flags = buildAlertFlags({ ...baseInput, symptoms: [vomit(1), vomit(3), vomit(5)] });
    expect(flags.map((f) => f.type)).toEqual(['persistent_vomiting']);

    // Vômitos antigos (fora dos 7 dias) não contam.
    const old = buildAlertFlags({ ...baseInput, symptoms: [vomit(1), vomit(10), vomit(12)] });
    expect(old).toEqual([]);
  });

  it('sinaliza 2+ doses esperadas seguidas sem registro', () => {
    const flags = buildAlertFlags({
      ...baseInput,
      adherence: {
        expected: 6,
        taken: 4,
        adherencePct: 67,
        currentGapSlots: 2,
        lastDoseAt: daysAgo(14),
      },
    });
    expect(flags.map((f) => f.type)).toEqual(['missed_doses']);
    expect(flags[0]!.detail).toContain('2 doses');
  });

  it('acumula múltiplas flags de forma independente', () => {
    const flags = buildAlertFlags({
      weightSummary: { latestKg: 80, totalChangeKg: -6, change30dKg: -4 },
      symptoms: [{ symptom: 'vomiting', severity: 'severe', occurredAt: daysAgo(1) }],
      adherence: {
        expected: 5,
        taken: 3,
        adherencePct: 60,
        currentGapSlots: 2,
        lastDoseAt: daysAgo(14),
      },
      now,
    });
    expect(flags.map((f) => f.type).sort()).toEqual([
      'missed_doses',
      'rapid_weight_loss',
      'severe_symptoms',
    ]);
  });
});
