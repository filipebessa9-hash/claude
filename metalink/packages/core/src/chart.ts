// Mapeamento genérico de séries temporais para coordenadas de polyline SVG.

export interface SeriesPoint {
  t: Date;
  value: number;
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
 * x linear no tempo, y invertido (valor maior = mais alto). Ponto único é
 * centralizado; série vazia retorna [].
 */
export function buildSeriesChartPoints(points: SeriesPoint[], layout: ChartLayout): ChartPoint[] {
  if (points.length === 0) {
    return [];
  }
  const padding = layout.padding ?? 8;
  const innerWidth = layout.width - padding * 2;
  const innerHeight = layout.height - padding * 2;
  const sorted = [...points].sort((a, b) => a.t.getTime() - b.t.getTime());

  const times = sorted.map((p) => p.t.getTime());
  const values = sorted.map((p) => p.value);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const timeSpan = maxTime - minTime;
  const valueSpan = maxValue - minValue;

  return sorted.map((p) => {
    const xRatio = timeSpan === 0 ? 0.5 : (p.t.getTime() - minTime) / timeSpan;
    const yRatio = valueSpan === 0 ? 0.5 : (p.value - minValue) / valueSpan;
    return {
      x: padding + xRatio * innerWidth,
      y: padding + (1 - yRatio) * innerHeight,
    };
  });
}
