// Agregado neutro dos check-ins diários para o painel do médico.

export interface CheckinLite {
  hunger: number | null;
  foodNoise: number | null;
  mood: number | null;
  energy: number | null;
  hydrationOk: boolean | null;
  proteinOk: boolean | null;
}

export interface CheckinSummary {
  count: number;
  hungerAvg: number | null;
  foodNoiseAvg: number | null;
  moodAvg: number | null;
  energyAvg: number | null;
  /** % de "sim" entre os dias respondidos; null se ninguém respondeu. */
  hydrationYesPct: number | null;
  proteinYesPct: number | null;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

function yesPct(values: boolean[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

export function summarizeCheckins(checkins: CheckinLite[]): CheckinSummary {
  const numeric = (pick: (c: CheckinLite) => number | null) =>
    checkins.map(pick).filter((v): v is number => v !== null);
  const boolAnswers = (pick: (c: CheckinLite) => boolean | null) =>
    checkins.map(pick).filter((v): v is boolean => v !== null);

  return {
    count: checkins.length,
    hungerAvg: average(numeric((c) => c.hunger)),
    foodNoiseAvg: average(numeric((c) => c.foodNoise)),
    moodAvg: average(numeric((c) => c.mood)),
    energyAvg: average(numeric((c) => c.energy)),
    hydrationYesPct: yesPct(boolAnswers((c) => c.hydrationOk)),
    proteinYesPct: yesPct(boolAnswers((c) => c.proteinOk)),
  };
}
