// Rotação de local de injeção (Seção 6): sugere o próximo local com base no
// último registrado, num ciclo fixo. Lógica simples, sem alarmismo.

import { INJECTION_SITES, type InjectionSite } from './types';

/**
 * Retorna o próximo local sugerido no ciclo de rotação.
 * Se não há registro anterior, sugere o primeiro local do ciclo.
 */
export function suggestNextInjectionSite(lastSite: InjectionSite | null): InjectionSite {
  if (lastSite === null) {
    return INJECTION_SITES[0];
  }
  const index = INJECTION_SITES.indexOf(lastSite);
  const next = INJECTION_SITES[(index + 1) % INJECTION_SITES.length];
  // indexOf nunca retorna -1 para um InjectionSite válido; o modulo garante o índice.
  return next as InjectionSite;
}
