// Lógica do fluxo de registro de dose (Fatia 1).
// Meta de produto: registro em < 15 segundos — por isso tudo aqui gira em
// torno de pré-preencher a próxima dose a partir da última registrada.

import { suggestNextInjectionSite } from './injection-rotation';
import { formatPtBrDecimal, parsePtBrDecimal } from './number';
import type { InjectionSite } from './types';

/** Limite de sanidade da UI; o banco só exige dose > 0. */
export const MAX_DOSE_MG = 100;

/**
 * Converte o texto digitado (aceita vírgula decimal pt-BR) em número.
 * Retorna null para entrada inválida.
 */
export function parseDoseInput(text: string): number | null {
  return parsePtBrDecimal(text);
}

export function isValidDoseMg(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= MAX_DOSE_MG;
}

/** Doses de escolha rápida a partir do esquema de titulação do medicamento. */
export function doseOptionsFromTitration(
  titration: { dose_mg: number; weeks: number | null }[],
): number[] {
  const unique = [...new Set(titration.map((step) => step.dose_mg))];
  return unique.filter((dose) => isValidDoseMg(dose)).sort((a, b) => a - b);
}

export interface LastDoseSummary {
  medicationId: string;
  doseMg: number;
  injectionSite: InjectionSite | null;
}

export interface DosePrefill {
  medicationId: string | null;
  doseMg: number | null;
  suggestedSite: InjectionSite;
}

/**
 * Pré-preenchimento da tela de registro: repete medicamento e dose da última
 * aplicação e sugere o próximo local no ciclo de rotação.
 */
export function buildDosePrefill(lastDose: LastDoseSummary | null): DosePrefill {
  return {
    medicationId: lastDose?.medicationId ?? null,
    doseMg: lastDose?.doseMg ?? null,
    suggestedSite: suggestNextInjectionSite(lastDose?.injectionSite ?? null),
  };
}

/** Formata a dose para exibição pt-BR (vírgula decimal, sem zeros à direita). */
export function formatDoseMg(value: number): string {
  return `${formatPtBrDecimal(value)} mg`;
}
