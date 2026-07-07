import { describe, expect, it } from 'vitest';

import { combineDayOffsetAndTime, formatRelativeDay, formatTimeHHMM } from '../src';

// 2026-07-07 é uma terça-feira; horário local do teste.
const now = new Date(2026, 6, 7, 14, 30, 0);

describe('combineDayOffsetAndTime', () => {
  it('combina hoje com um horário válido no passado', () => {
    const result = combineDayOffsetAndTime(now, 0, '08:15');
    expect(result?.getDate()).toBe(7);
    expect(result?.getHours()).toBe(8);
    expect(result?.getMinutes()).toBe(15);
  });

  it('combina ontem e anteontem', () => {
    expect(combineDayOffsetAndTime(now, 1, '22:00')?.getDate()).toBe(6);
    expect(combineDayOffsetAndTime(now, 2, '22:00')?.getDate()).toBe(5);
  });

  it('rejeita horário no futuro (hoje, depois de agora)', () => {
    expect(combineDayOffsetAndTime(now, 0, '18:00')).toBeNull();
  });

  it('rejeita formatos e valores inválidos', () => {
    expect(combineDayOffsetAndTime(now, 0, '25:00')).toBeNull();
    expect(combineDayOffsetAndTime(now, 0, '10:75')).toBeNull();
    expect(combineDayOffsetAndTime(now, 0, 'abc')).toBeNull();
    expect(combineDayOffsetAndTime(now, 0, '')).toBeNull();
  });
});

describe('formatTimeHHMM', () => {
  it('formata com zero à esquerda', () => {
    expect(formatTimeHHMM(new Date(2026, 6, 7, 8, 5))).toBe('08:05');
    expect(formatTimeHHMM(new Date(2026, 6, 7, 23, 59))).toBe('23:59');
  });
});

describe('formatRelativeDay', () => {
  it('reconhece hoje e ontem', () => {
    expect(formatRelativeDay(new Date(2026, 6, 7, 9, 0), now)).toBe('Hoje');
    expect(formatRelativeDay(new Date(2026, 6, 6, 23, 0), now)).toBe('Ontem');
  });

  it('usa dd/mm/aaaa para dias anteriores', () => {
    expect(formatRelativeDay(new Date(2026, 6, 1, 9, 0), now)).toBe('01/07/2026');
  });
});
