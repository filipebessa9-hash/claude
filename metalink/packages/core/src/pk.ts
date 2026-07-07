// Nível estimado de medicação (Seção 6): modelo PK de compartimento único —
// decaimento exponencial pela meia-vida, acumulado entre doses.
//
// É uma ESTIMATIVA EDUCATIVA, não um valor clínico. Toda tela que exibir
// esses números deve mostrar PK_ESTIMATE_DISCLAIMER (labels.ts).
// Por isso a UI exibe nível RELATIVO ao pico recente (%), nunca "mg no corpo".

const HOUR_MS = 60 * 60 * 1000;

export interface PkDose {
  takenAt: Date;
  doseMg: number;
}

export interface PkPoint {
  at: Date;
  level: number;
}

/**
 * Nível estimado no instante `at`: soma de doseMg * 2^(-Δt/meia-vida)
 * para toda dose aplicada até `at`. Unidade arbitrária (mg-equivalentes).
 */
export function estimateLevelAt(doses: PkDose[], halfLifeHours: number, at: Date): number {
  if (halfLifeHours <= 0) {
    throw new Error('halfLifeHours must be positive');
  }
  const atMs = at.getTime();
  let level = 0;
  for (const dose of doses) {
    const elapsedHours = (atMs - dose.takenAt.getTime()) / HOUR_MS;
    if (elapsedHours < 0) {
      continue; // dose futura não contribui
    }
    level += dose.doseMg * Math.pow(2, -elapsedHours / halfLifeHours);
  }
  return level;
}

export interface PkCurveOptions {
  from: Date;
  to: Date;
  /** Resolução da curva (padrão 6h). */
  stepHours?: number;
}

export function buildPkCurve(
  doses: PkDose[],
  halfLifeHours: number,
  options: PkCurveOptions,
): PkPoint[] {
  const stepMs = (options.stepHours ?? 6) * HOUR_MS;
  const points: PkPoint[] = [];
  for (let t = options.from.getTime(); t <= options.to.getTime(); t += stepMs) {
    const at = new Date(t);
    points.push({ at, level: estimateLevelAt(doses, halfLifeHours, at) });
  }
  return points;
}

/**
 * Nível atual como % do pico da janela (0–100, arredondado).
 * null quando a curva é toda zero (sem doses no período).
 */
export function relativeLevelPct(curve: PkPoint[], current: number): number | null {
  const peak = curve.reduce((max, p) => Math.max(max, p.level), 0);
  if (peak <= 0) {
    return null;
  }
  return Math.round((current / peak) * 100);
}
