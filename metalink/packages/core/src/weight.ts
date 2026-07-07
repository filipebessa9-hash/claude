// Lógica de peso e tendência (Fatia 2). Tom do produto: informativo e
// não-julgador — aqui só números; nada de "metas" ou juízo de valor.

import { buildSeriesChartPoints, type ChartLayout, type ChartPoint } from './chart';
import { formatPtBrDecimal, parsePtBrDecimal } from './number';

// Mesma faixa do CHECK de weight_logs no banco.
export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 400;

export function parseWeightInput(text: string): number | null {
  return parsePtBrDecimal(text);
}

export function isValidWeightKg(value: number): boolean {
  return Number.isFinite(value) && value >= MIN_WEIGHT_KG && value <= MAX_WEIGHT_KG;
}

export function formatWeightKg(value: number): string {
  return `${formatPtBrDecimal(value)} kg`;
}

export interface WeightPoint {
  measuredAt: Date;
  weightKg: number;
}

export interface WeightTrendSummary {
  latestKg: number;
  /** Variação desde o primeiro registro (negativa = redução). */
  totalChangeKg: number;
  /** Variação nos últimos 30 dias; null se não há registro anterior a 30 dias. */
  change30dKg: number | null;
}

/** Resumo neutro da tendência; null sem registros. Aceita pontos fora de ordem. */
export function summarizeWeightTrend(points: WeightPoint[], now: Date): WeightTrendSummary | null {
  if (points.length === 0) {
    return null;
  }
  const sorted = [...points].sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime());
  const first = sorted[0]!;
  const latest = sorted[sorted.length - 1]!;
  const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  // Registro mais recente ANTES da janela de 30 dias, como linha de base.
  const baseline30 = [...sorted].reverse().find((p) => p.measuredAt.getTime() <= cutoff) ?? null;
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return {
    latestKg: latest.weightKg,
    totalChangeKg: round1(latest.weightKg - first.weightKg),
    change30dKg: baseline30 ? round1(latest.weightKg - baseline30.weightKg) : null,
  };
}

/**
 * Converte a série de pesos em coordenadas para uma polyline SVG.
 * Delegado ao helper genérico de séries temporais (chart.ts).
 */
export function buildWeightChartPoints(points: WeightPoint[], layout: ChartLayout): ChartPoint[] {
  return buildSeriesChartPoints(
    points.map((p) => ({ t: p.measuredAt, value: p.weightKg })),
    layout,
  );
}
