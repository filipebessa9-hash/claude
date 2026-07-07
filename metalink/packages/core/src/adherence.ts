// Aderência (Seção 6): doses esperadas pelo esquema vs. registradas,
// com tolerância de janela configurável.
//
// ASSUMPTION: sem prescrição estruturada no MVP, o esquema é inferido dos
// próprios registros — a âncora é a primeira dose do período e o intervalo
// vem da via do medicamento (semanal = 7 dias, diário/oral = 1 dia).

import type { MedicationRoute } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function intervalDaysForRoute(route: MedicationRoute): number {
  return route === 'weekly_injectable' ? 7 : 1;
}

/** Tolerância padrão: semanal ±1 dia; diário ±12h. */
export function defaultToleranceDays(intervalDays: number): number {
  return intervalDays >= 7 ? 1 : 0.5;
}

export interface AdherenceOptions {
  intervalDays: number;
  now: Date;
  /** Janela de análise em dias (padrão 90). */
  periodDays?: number;
  /** Tolerância em dias para considerar uma dose "no horário". */
  toleranceDays?: number;
}

export interface AdherenceSummary {
  /** Doses esperadas pelo esquema dentro do período. */
  expected: number;
  /** Doses esperadas que têm registro dentro da tolerância. */
  taken: number;
  /** 0–100, arredondado. */
  adherencePct: number;
  /** Doses esperadas consecutivas SEM registro, contadas do fim do período. */
  currentGapSlots: number;
  lastDoseAt: Date;
}

/**
 * Retorna null quando não há nenhuma dose no período — sem âncora não há
 * como estimar o esquema (a UI deve dizer isso, não mostrar 0%).
 */
export function computeAdherence(
  doseTimes: Date[],
  options: AdherenceOptions,
): AdherenceSummary | null {
  const periodDays = options.periodDays ?? 90;
  const toleranceDays = options.toleranceDays ?? defaultToleranceDays(options.intervalDays);
  const endMs = options.now.getTime();
  const startMs = endMs - periodDays * DAY_MS;

  const times = doseTimes
    .map((d) => d.getTime())
    .filter((t) => t >= startMs && t <= endMs)
    .sort((a, b) => a - b);
  if (times.length === 0) {
    return null;
  }

  const intervalMs = options.intervalDays * DAY_MS;
  const toleranceMs = toleranceDays * DAY_MS;
  const anchor = times[0]!;

  const matched: boolean[] = [];
  for (let slot = anchor; slot <= endMs; slot += intervalMs) {
    matched.push(times.some((t) => Math.abs(t - slot) <= toleranceMs));
  }

  const taken = matched.filter(Boolean).length;
  let currentGapSlots = 0;
  for (let i = matched.length - 1; i >= 0; i--) {
    if (matched[i]) {
      break;
    }
    currentGapSlots++;
  }

  return {
    expected: matched.length,
    taken,
    adherencePct: Math.round((taken / matched.length) * 100),
    currentGapSlots,
    lastDoseAt: new Date(times[times.length - 1]!),
  };
}
