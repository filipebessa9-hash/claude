import { describe, expect, it } from 'vitest';

import {
  CONSENT_TYPES,
  INJECTION_SITES,
  LINK_STATUSES,
  MEDICATION_ROUTES,
  PK_ESTIMATE_DISCLAIMER,
  SYMPTOM_SEVERITIES,
  SYMPTOM_TYPES,
  USER_ROLES,
  consentTypeLabels,
  injectionSiteLabels,
  linkStatusLabels,
  medicationRouteLabels,
  symptomSeverityLabels,
  symptomTypeLabels,
  userRoleLabels,
} from '../src';

describe('labels pt-BR', () => {
  it('cobre todos os valores de cada enum, sem label vazio', () => {
    const cases: [readonly string[], Record<string, string>][] = [
      [USER_ROLES, userRoleLabels],
      [MEDICATION_ROUTES, medicationRouteLabels],
      [INJECTION_SITES, injectionSiteLabels],
      [SYMPTOM_TYPES, symptomTypeLabels],
      [SYMPTOM_SEVERITIES, symptomSeverityLabels],
      [LINK_STATUSES, linkStatusLabels],
      [CONSENT_TYPES, consentTypeLabels],
    ];
    for (const [values, labels] of cases) {
      for (const value of values) {
        expect(labels[value], `label ausente para "${value}"`).toBeTruthy();
      }
      expect(Object.keys(labels).sort()).toEqual([...values].sort());
    }
  });

  it('disclaimer da estimativa PK contém os avisos exigidos pela Seção 6', () => {
    expect(PK_ESTIMATE_DISCLAIMER).toContain('Estimativa educativa');
    expect(PK_ESTIMATE_DISCLAIMER).toContain('Consulte seu médico');
  });
});
