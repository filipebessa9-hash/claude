import { describe, expect, it } from 'vitest';

import { summarizeCheckins, type CheckinLite } from '../src';

const empty: CheckinLite = {
  hunger: null,
  foodNoise: null,
  mood: null,
  energy: null,
  hydrationOk: null,
  proteinOk: null,
};

describe('summarizeCheckins', () => {
  it('lista vazia: contagem zero e tudo null', () => {
    const summary = summarizeCheckins([]);
    expect(summary.count).toBe(0);
    expect(summary.hungerAvg).toBeNull();
    expect(summary.hydrationYesPct).toBeNull();
  });

  it('médias ignoram campos não respondidos e arredondam a 1 casa', () => {
    const summary = summarizeCheckins([
      { ...empty, hunger: 2, mood: 4, hydrationOk: true },
      { ...empty, hunger: 3, mood: 5, hydrationOk: false },
      { ...empty, hunger: 3, proteinOk: true },
    ]);
    expect(summary.count).toBe(3);
    expect(summary.hungerAvg).toBe(2.7);
    expect(summary.moodAvg).toBe(4.5);
    expect(summary.energyAvg).toBeNull();
    expect(summary.hydrationYesPct).toBe(50);
    expect(summary.proteinYesPct).toBe(100);
  });
});
