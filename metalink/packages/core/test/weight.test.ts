import { describe, expect, it } from 'vitest';

import {
  buildWeightChartPoints,
  formatWeightKg,
  isValidWeightKg,
  parseWeightInput,
  summarizeWeightTrend,
  toLocalDateString,
  type WeightPoint,
} from '../src';

const day = (d: number) => new Date(2026, 6, d, 8, 0, 0);
const now = new Date(2026, 6, 31, 12, 0, 0);

describe('parseWeightInput / isValidWeightKg', () => {
  it('aceita vírgula pt-BR e valida a faixa do banco (20–400 kg)', () => {
    expect(parseWeightInput('82,5')).toBe(82.5);
    expect(parseWeightInput('105')).toBe(105);
    expect(parseWeightInput('abc')).toBeNull();
    expect(isValidWeightKg(82.5)).toBe(true);
    expect(isValidWeightKg(19.9)).toBe(false);
    expect(isValidWeightKg(400.1)).toBe(false);
  });
});

describe('formatWeightKg', () => {
  it('formata com vírgula decimal', () => {
    expect(formatWeightKg(82.5)).toBe('82,5 kg');
    expect(formatWeightKg(90)).toBe('90 kg');
  });
});

describe('summarizeWeightTrend', () => {
  it('retorna null sem registros', () => {
    expect(summarizeWeightTrend([], now)).toBeNull();
  });

  it('calcula último peso e variação total, mesmo com pontos fora de ordem', () => {
    const points: WeightPoint[] = [
      { measuredAt: day(20), weightKg: 88 },
      { measuredAt: day(1), weightKg: 90 },
      { measuredAt: day(30), weightKg: 87.2 },
    ];
    const summary = summarizeWeightTrend(points, now)!;
    expect(summary.latestKg).toBe(87.2);
    expect(summary.totalChangeKg).toBe(-2.8);
  });

  it('variação de 30 dias usa o registro mais recente anterior à janela', () => {
    const points: WeightPoint[] = [
      { measuredAt: new Date(2026, 4, 15), weightKg: 95 }, // > 30 dias atrás
      { measuredAt: new Date(2026, 5, 25), weightKg: 92 }, // > 30 dias atrás (baseline)
      { measuredAt: day(20), weightKg: 89 },
    ];
    const summary = summarizeWeightTrend(points, now)!;
    expect(summary.change30dKg).toBe(-3);
  });

  it('sem registro anterior a 30 dias, variação 30d é null', () => {
    const summary = summarizeWeightTrend([{ measuredAt: day(20), weightKg: 89 }], now)!;
    expect(summary.change30dKg).toBeNull();
  });
});

describe('buildWeightChartPoints', () => {
  const layout = { width: 300, height: 100, padding: 10 };

  it('retorna vazio sem registros', () => {
    expect(buildWeightChartPoints([], layout)).toEqual([]);
  });

  it('centraliza um único ponto', () => {
    const [point] = buildWeightChartPoints([{ measuredAt: day(1), weightKg: 90 }], layout);
    expect(point).toEqual({ x: 150, y: 50 });
  });

  it('mapeia extremos para as bordas internas, com y invertido', () => {
    const points = buildWeightChartPoints(
      [
        { measuredAt: day(1), weightKg: 90 },
        { measuredAt: day(31), weightKg: 80 },
      ],
      layout,
    );
    // Primeiro ponto: início do tempo (x=padding), maior peso (y=padding, topo).
    expect(points[0]).toEqual({ x: 10, y: 10 });
    // Último ponto: fim do tempo (x=width-padding), menor peso (fundo).
    expect(points[1]).toEqual({ x: 290, y: 90 });
  });

  it('ordena pontos fora de ordem antes de mapear', () => {
    const points = buildWeightChartPoints(
      [
        { measuredAt: day(31), weightKg: 80 },
        { measuredAt: day(1), weightKg: 90 },
      ],
      layout,
    );
    expect(points[0]!.x).toBeLessThan(points[1]!.x);
  });
});

describe('toLocalDateString', () => {
  it('formata AAAA-MM-DD com zeros à esquerda', () => {
    expect(toLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toLocalDateString(new Date(2026, 11, 25))).toBe('2026-12-25');
  });
});
