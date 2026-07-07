// Resumo semanal (Fatia 6): números neutros da última semana para o digest
// do paciente. Tom encorajador fica na UI; aqui só agregação testável.

import type { SymptomEvent } from './alerts';
import type { WeightPoint } from './weight';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export interface WeeklyInputs {
  doseTimes: Date[];
  weightPoints: WeightPoint[];
  symptoms: SymptomEvent[];
  checkinCount: number;
  /** Intervalo do esquema em dias (7 semanal, 1 diário); null se desconhecido. */
  intervalDays: number | null;
  now: Date;
}

export interface WeeklySummary {
  doseCount: number;
  /** Doses esperadas na semana pelo esquema; null se esquema desconhecido. */
  expectedDoses: number | null;
  /** Variação vs. o último peso anterior à semana (ou o primeiro da semana). */
  weightChangeKg: number | null;
  latestWeightKg: number | null;
  weightCount: number;
  symptomCount: number;
  severeSymptomCount: number;
  checkinCount: number;
}

export function buildWeeklySummary(input: WeeklyInputs): WeeklySummary {
  const end = input.now.getTime();
  const start = end - WEEK_MS;
  const inWindow = (t: Date) => t.getTime() > start && t.getTime() <= end;

  const doseCount = input.doseTimes.filter(inWindow).length;
  const expectedDoses =
    input.intervalDays && input.intervalDays > 0 ? Math.round(7 / input.intervalDays) : null;

  const sortedWeights = [...input.weightPoints].sort(
    (a, b) => a.measuredAt.getTime() - b.measuredAt.getTime(),
  );
  const weekWeights = sortedWeights.filter((p) => inWindow(p.measuredAt));
  const baseline =
    [...sortedWeights].reverse().find((p) => p.measuredAt.getTime() <= start) ??
    weekWeights[0] ??
    null;
  const latest = weekWeights[weekWeights.length - 1] ?? null;
  const round1 = (v: number) => Math.round(v * 10) / 10;
  const weightChangeKg =
    latest && baseline && latest !== baseline ? round1(latest.weightKg - baseline.weightKg) : null;

  const weekSymptoms = input.symptoms.filter((s) => inWindow(s.occurredAt));

  return {
    doseCount,
    expectedDoses,
    weightChangeKg,
    latestWeightKg: latest?.weightKg ?? null,
    weightCount: weekWeights.length,
    symptomCount: weekSymptoms.length,
    severeSymptomCount: weekSymptoms.filter((s) => s.severity === 'severe').length,
    checkinCount: input.checkinCount,
  };
}
