import { describe, expect, it } from 'vitest';

import {
  buildDosePrefill,
  doseOptionsFromTitration,
  formatDoseMg,
  isValidDoseMg,
  parseDoseInput,
} from '../src';

describe('parseDoseInput', () => {
  it('aceita vírgula decimal pt-BR e ponto', () => {
    expect(parseDoseInput('0,25')).toBe(0.25);
    expect(parseDoseInput('0.25')).toBe(0.25);
    expect(parseDoseInput(' 2 ')).toBe(2);
    expect(parseDoseInput('15')).toBe(15);
  });

  it('rejeita entradas inválidas', () => {
    expect(parseDoseInput('')).toBeNull();
    expect(parseDoseInput('abc')).toBeNull();
    expect(parseDoseInput('1,2,3')).toBeNull();
    expect(parseDoseInput('-1')).toBeNull();
    expect(parseDoseInput('1e3')).toBeNull();
  });
});

describe('isValidDoseMg', () => {
  it('exige dose positiva dentro do limite de sanidade', () => {
    expect(isValidDoseMg(0.25)).toBe(true);
    expect(isValidDoseMg(15)).toBe(true);
    expect(isValidDoseMg(0)).toBe(false);
    expect(isValidDoseMg(-1)).toBe(false);
    expect(isValidDoseMg(101)).toBe(false);
    expect(isValidDoseMg(Number.NaN)).toBe(false);
  });
});

describe('doseOptionsFromTitration', () => {
  it('extrai doses únicas e ordenadas do esquema de titulação', () => {
    const titration = [
      { dose_mg: 1.0, weeks: 4 },
      { dose_mg: 0.25, weeks: 4 },
      { dose_mg: 0.5, weeks: 4 },
      { dose_mg: 0.25, weeks: 4 },
    ];
    expect(doseOptionsFromTitration(titration)).toEqual([0.25, 0.5, 1.0]);
  });

  it('retorna vazio para titulação vazia', () => {
    expect(doseOptionsFromTitration([])).toEqual([]);
  });
});

describe('buildDosePrefill', () => {
  it('sem última dose: nada pré-selecionado, sugere primeiro local do ciclo', () => {
    const prefill = buildDosePrefill(null);
    expect(prefill.medicationId).toBeNull();
    expect(prefill.doseMg).toBeNull();
    expect(prefill.suggestedSite).toBe('abdomen_left');
  });

  it('repete medicamento e dose e avança o local de injeção', () => {
    const prefill = buildDosePrefill({
      medicationId: 'med-1',
      doseMg: 0.5,
      injectionSite: 'thigh_left',
    });
    expect(prefill.medicationId).toBe('med-1');
    expect(prefill.doseMg).toBe(0.5);
    expect(prefill.suggestedSite).toBe('thigh_right');
  });

  it('última dose sem local registrado: sugere início do ciclo', () => {
    const prefill = buildDosePrefill({ medicationId: 'med-1', doseMg: 3, injectionSite: null });
    expect(prefill.suggestedSite).toBe('abdomen_left');
  });
});

describe('formatDoseMg', () => {
  it('formata com vírgula decimal pt-BR', () => {
    expect(formatDoseMg(0.25)).toBe('0,25 mg');
    expect(formatDoseMg(15)).toBe('15 mg');
  });
});
