import { describe, expect, it } from 'vitest';

import { computeNextDoseReminder } from '../src';

const now = new Date(2026, 6, 29, 12, 0, 0); // 29/07/2026 12:00
const daysAgo = (d: number, hour = 9) => {
  const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  date.setHours(hour, 0, 0, 0);
  return date;
};

describe('computeNextDoseReminder', () => {
  it('semanal: última dose há 3 dias → lembrete em 4 dias', () => {
    const next = computeNextDoseReminder(daysAgo(3), 7, now);
    expect(next.getTime()).toBeGreaterThan(now.getTime());
    expect(next.getDate()).toBe(new Date(now.getTime() + 4 * 86400000).getDate());
  });

  it('dose atrasada: avança intervalos até cair no futuro', () => {
    const next = computeNextDoseReminder(daysAgo(10), 7, now);
    // 10 dias atrás + 7 = 3 dias atrás (passado) → +7 = daqui a 4 dias.
    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });

  it('horário preferido ajusta a hora do dia', () => {
    const next = computeNextDoseReminder(daysAgo(3), 7, now, { hour: 20, minute: 30 });
    expect(next.getHours()).toBe(20);
    expect(next.getMinutes()).toBe(30);
  });

  it('horário preferido que cai no passado empurra um intervalo', () => {
    // Diário: última dose ontem 9h; next = hoje 9h; com hora 8h ficaria no
    // passado (agora é 12h) → empurra para amanhã 8h.
    const next = computeNextDoseReminder(daysAgo(1), 1, now, { hour: 8 });
    expect(next.getTime()).toBeGreaterThan(now.getTime());
    expect(next.getHours()).toBe(8);
  });

  it('intervalo inválido é rejeitado', () => {
    expect(() => computeNextDoseReminder(daysAgo(1), 0, now)).toThrow();
  });
});
