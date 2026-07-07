import { describe, expect, it } from 'vitest';

import { buildWeeklySummary, type SymptomEvent, type WeightPoint } from '../src';

const now = new Date(2026, 6, 29, 12, 0, 0);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

describe('buildWeeklySummary', () => {
  it('conta apenas eventos da última semana', () => {
    const summary = buildWeeklySummary({
      doseTimes: [daysAgo(1), daysAgo(6), daysAgo(9)],
      weightPoints: [],
      symptoms: [],
      checkinCount: 3,
      intervalDays: 7,
      now,
    });
    expect(summary.doseCount).toBe(2);
    expect(summary.expectedDoses).toBe(1);
    expect(summary.checkinCount).toBe(3);
  });

  it('esquema diário espera 7 doses; esquema desconhecido → null', () => {
    expect(
      buildWeeklySummary({
        doseTimes: [],
        weightPoints: [],
        symptoms: [],
        checkinCount: 0,
        intervalDays: 1,
        now,
      }).expectedDoses,
    ).toBe(7);
    expect(
      buildWeeklySummary({
        doseTimes: [],
        weightPoints: [],
        symptoms: [],
        checkinCount: 0,
        intervalDays: null,
        now,
      }).expectedDoses,
    ).toBeNull();
  });

  it('variação de peso usa o último peso anterior à semana como base', () => {
    const weights: WeightPoint[] = [
      { measuredAt: daysAgo(10), weightKg: 90 },
      { measuredAt: daysAgo(5), weightKg: 89 },
      { measuredAt: daysAgo(1), weightKg: 88.5 },
    ];
    const summary = buildWeeklySummary({
      doseTimes: [],
      weightPoints: weights,
      symptoms: [],
      checkinCount: 0,
      intervalDays: 7,
      now,
    });
    expect(summary.weightChangeKg).toBe(-1.5);
    expect(summary.latestWeightKg).toBe(88.5);
    expect(summary.weightCount).toBe(2);
  });

  it('sem base de comparação, variação é null', () => {
    const summary = buildWeeklySummary({
      doseTimes: [],
      weightPoints: [{ measuredAt: daysAgo(2), weightKg: 88 }],
      symptoms: [],
      checkinCount: 0,
      intervalDays: 7,
      now,
    });
    expect(summary.weightChangeKg).toBeNull();
    expect(summary.latestWeightKg).toBe(88);
  });

  it('conta sintomas da semana e destaca os intensos', () => {
    const symptoms: SymptomEvent[] = [
      { symptom: 'nausea', severity: 'mild', occurredAt: daysAgo(2) },
      { symptom: 'vomiting', severity: 'severe', occurredAt: daysAgo(3) },
      { symptom: 'fatigue', severity: 'moderate', occurredAt: daysAgo(12) },
    ];
    const summary = buildWeeklySummary({
      doseTimes: [],
      weightPoints: [],
      symptoms,
      checkinCount: 0,
      intervalDays: 7,
      now,
    });
    expect(summary.symptomCount).toBe(2);
    expect(summary.severeSymptomCount).toBe(1);
  });
});
