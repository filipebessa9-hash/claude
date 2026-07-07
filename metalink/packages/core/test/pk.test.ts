import { describe, expect, it } from 'vitest';

import { buildPkCurve, estimateLevelAt, relativeLevelPct, type PkDose } from '../src';

const HOUR_MS = 60 * 60 * 1000;
const t0 = new Date(2026, 6, 1, 8, 0, 0);
const hoursAfter = (h: number) => new Date(t0.getTime() + h * HOUR_MS);

describe('estimateLevelAt', () => {
  it('sem doses, nível zero', () => {
    expect(estimateLevelAt([], 168, t0)).toBe(0);
  });

  it('no instante da dose, nível = dose; após uma meia-vida, metade', () => {
    const doses: PkDose[] = [{ takenAt: t0, doseMg: 1 }];
    expect(estimateLevelAt(doses, 168, t0)).toBe(1);
    expect(estimateLevelAt(doses, 168, hoursAfter(168))).toBeCloseTo(0.5, 10);
    expect(estimateLevelAt(doses, 168, hoursAfter(336))).toBeCloseTo(0.25, 10);
  });

  it('doses semanais acumulam (semaglutida: meia-vida ≈ intervalo)', () => {
    const doses: PkDose[] = [
      { takenAt: t0, doseMg: 1 },
      { takenAt: hoursAfter(168), doseMg: 1 },
    ];
    // Logo após a 2ª dose: 1 (nova) + 0,5 (restante da 1ª).
    expect(estimateLevelAt(doses, 168, hoursAfter(168))).toBeCloseTo(1.5, 10);
  });

  it('dose futura não contribui', () => {
    const doses: PkDose[] = [{ takenAt: hoursAfter(24), doseMg: 1 }];
    expect(estimateLevelAt(doses, 168, t0)).toBe(0);
  });

  it('meia-vida inválida é rejeitada', () => {
    expect(() => estimateLevelAt([], 0, t0)).toThrow();
  });
});

describe('buildPkCurve', () => {
  it('gera pontos no passo pedido, decaindo entre doses', () => {
    const doses: PkDose[] = [{ takenAt: t0, doseMg: 2 }];
    const curve = buildPkCurve(doses, 168, { from: t0, to: hoursAfter(24), stepHours: 6 });
    expect(curve).toHaveLength(5); // 0h, 6h, 12h, 18h, 24h
    expect(curve[0]!.level).toBe(2);
    // Estritamente decrescente sem novas doses.
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]!.level).toBeLessThan(curve[i - 1]!.level);
    }
  });

  it('sem doses, curva zerada', () => {
    const curve = buildPkCurve([], 168, { from: t0, to: hoursAfter(12), stepHours: 6 });
    expect(curve.every((p) => p.level === 0)).toBe(true);
  });
});

describe('relativeLevelPct', () => {
  it('percentual do pico da janela, arredondado', () => {
    const curve = [
      { at: t0, level: 2 },
      { at: hoursAfter(6), level: 1 },
    ];
    expect(relativeLevelPct(curve, 1)).toBe(50);
    expect(relativeLevelPct(curve, 2)).toBe(100);
  });

  it('curva toda zero → null (sem doses, sem estimativa)', () => {
    expect(relativeLevelPct([{ at: t0, level: 0 }], 0)).toBeNull();
  });
});
