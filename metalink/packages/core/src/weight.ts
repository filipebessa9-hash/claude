// Lógica de peso e tendência (Fatia 2). Tom do produto: informativo e
// não-julgador — aqui só números; nada de "metas" ou juízo de valor.

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

export interface ChartPoint {
  x: number;
  y: number;
}

export interface ChartLayout {
  width: number;
  height: number;
  padding?: number;
}

/**
 * Converte a série de pesos em coordenadas para uma polyline SVG:
 * x linear no tempo, y invertido (peso maior = mais alto no gráfico).
 * Um único ponto é centralizado. Retorna [] sem registros.
 */
export function buildWeightChartPoints(points: WeightPoint[], layout: ChartLayout): ChartPoint[] {
  if (points.length === 0) {
    return [];
  }
  const padding = layout.padding ?? 8;
  const innerWidth = layout.width - padding * 2;
  const innerHeight = layout.height - padding * 2;
  const sorted = [...points].sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime());

  const times = sorted.map((p) => p.measuredAt.getTime());
  const weights = sorted.map((p) => p.weightKg);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const timeSpan = maxTime - minTime;
  const weightSpan = maxWeight - minWeight;

  return sorted.map((p) => {
    const xRatio = timeSpan === 0 ? 0.5 : (p.measuredAt.getTime() - minTime) / timeSpan;
    const yRatio = weightSpan === 0 ? 0.5 : (p.weightKg - minWeight) / weightSpan;
    return {
      x: padding + xRatio * innerWidth,
      y: padding + (1 - yRatio) * innerHeight,
    };
  });
}
