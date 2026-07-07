import { describe, expect, it } from 'vitest';

import { isCompleteInviteCode, normalizeInviteCode } from '../src';

describe('normalizeInviteCode', () => {
  it('remove espaços e hífens e sobe para caixa alta', () => {
    expect(normalizeInviteCode(' a1b2-c3d4 ')).toBe('A1B2C3D4');
  });

  it('corrige confusões de leitura: O→0, I/L→1', () => {
    expect(normalizeInviteCode('Oi lO')).toBe('0110');
    expect(normalizeInviteCode('AB0OIL12')).toBe('AB001112');
  });
});

describe('isCompleteInviteCode', () => {
  it('aceita 8 caracteres hex após normalização', () => {
    expect(isCompleteInviteCode('a1b2c3d4')).toBe(true);
    expect(isCompleteInviteCode('A1B2-C3D4')).toBe(true);
    expect(isCompleteInviteCode('O1B2C3D4')).toBe(true); // O vira 0
  });

  it('rejeita comprimento errado ou caracteres fora do hex', () => {
    expect(isCompleteInviteCode('A1B2C3')).toBe(false);
    expect(isCompleteInviteCode('A1B2C3D4E5')).toBe(false);
    expect(isCompleteInviteCode('G1B2C3D4')).toBe(false);
    expect(isCompleteInviteCode('')).toBe(false);
  });
});
