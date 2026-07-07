import { describe, expect, it } from 'vitest';

import { INJECTION_SITES, suggestNextInjectionSite } from '../src';

describe('suggestNextInjectionSite', () => {
  it('sugere o primeiro local do ciclo quando não há registro anterior', () => {
    expect(suggestNextInjectionSite(null)).toBe(INJECTION_SITES[0]);
  });

  it('avança um passo no ciclo a partir do último local', () => {
    expect(suggestNextInjectionSite('abdomen_left')).toBe('abdomen_right');
    expect(suggestNextInjectionSite('abdomen_right')).toBe('thigh_left');
  });

  it('volta ao início após o último local do ciclo', () => {
    const last = INJECTION_SITES[INJECTION_SITES.length - 1]!;
    expect(suggestNextInjectionSite(last)).toBe(INJECTION_SITES[0]);
  });
});
