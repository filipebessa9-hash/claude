// Sinais de alerta para o painel do médico (Seção 6).
// São flags NEUTRAS para atenção do médico — nunca diagnóstico nem ação
// automática. Texto informativo, sem prescrever conduta.

import type { AdherenceSummary } from './adherence';
import { formatPtBrDecimal } from './number';
import { symptomTypeLabels } from './labels';
import type { SymptomSeverity, SymptomType } from './types';
import type { WeightTrendSummary } from './weight';

const DAY_MS = 24 * 60 * 60 * 1000;

// ASSUMPTION: thresholds iniciais, a calibrar com feedback clínico.
// Perda: ~1% do peso corporal/semana sustentada => 4% em 30 dias.
export const RAPID_LOSS_30D_FRACTION = 0.04;
// Ganho sob terapia GLP-1: 3% em 30 dias merece atenção.
export const GAIN_30D_FRACTION = 0.03;
// Vômitos recorrentes: 3+ registros nos últimos 7 dias.
export const VOMITING_COUNT_7D = 3;
// Doses puladas em sequência: 2+ doses esperadas sem registro.
export const MISSED_DOSES_IN_A_ROW = 2;

export type AlertFlagType =
  'rapid_weight_loss' | 'weight_gain' | 'severe_symptoms' | 'persistent_vomiting' | 'missed_doses';

export interface AlertFlag {
  type: AlertFlagType;
  title: string;
  detail: string;
}

export interface SymptomEvent {
  symptom: SymptomType;
  severity: SymptomSeverity;
  occurredAt: Date;
}

export interface AlertInputs {
  weightSummary: WeightTrendSummary | null;
  /** Sintomas do período analisado (ex.: últimos 30 dias). */
  symptoms: SymptomEvent[];
  adherence: AdherenceSummary | null;
  now: Date;
}

export function buildAlertFlags(input: AlertInputs): AlertFlag[] {
  const flags: AlertFlag[] = [];

  const weight = input.weightSummary;
  if (weight && weight.change30dKg !== null && weight.latestKg > 0) {
    const fraction = weight.change30dKg / weight.latestKg;
    const absKg = formatPtBrDecimal(Math.abs(weight.change30dKg));
    const absPct = formatPtBrDecimal(Math.round(Math.abs(fraction) * 1000) / 10);
    if (fraction <= -RAPID_LOSS_30D_FRACTION) {
      flags.push({
        type: 'rapid_weight_loss',
        title: 'Perda de peso acelerada',
        detail: `Redução de ${absKg} kg nos últimos 30 dias (≈${absPct}% do peso atual).`,
      });
    } else if (fraction >= GAIN_30D_FRACTION) {
      flags.push({
        type: 'weight_gain',
        title: 'Ganho de peso no período',
        detail: `Aumento de ${absKg} kg nos últimos 30 dias (≈${absPct}% do peso atual).`,
      });
    }
  }

  const severe = input.symptoms.filter((s) => s.severity === 'severe');
  if (severe.length > 0) {
    const types = [...new Set(severe.map((s) => symptomTypeLabels[s.symptom]))].join(', ');
    flags.push({
      type: 'severe_symptoms',
      title: 'Sintomas intensos relatados',
      detail: `${severe.length} registro(s) no período: ${types}.`,
    });
  }

  const weekAgo = input.now.getTime() - 7 * DAY_MS;
  const recentVomiting = input.symptoms.filter(
    (s) => s.symptom === 'vomiting' && s.occurredAt.getTime() >= weekAgo,
  );
  if (recentVomiting.length >= VOMITING_COUNT_7D) {
    flags.push({
      type: 'persistent_vomiting',
      title: 'Vômitos recorrentes na última semana',
      detail: `${recentVomiting.length} registros nos últimos 7 dias.`,
    });
  }

  if (input.adherence && input.adherence.currentGapSlots >= MISSED_DOSES_IN_A_ROW) {
    flags.push({
      type: 'missed_doses',
      title: 'Doses seguidas sem registro',
      detail: `${input.adherence.currentGapSlots} doses esperadas sem registro desde a última aplicação.`,
    });
  }

  return flags;
}
