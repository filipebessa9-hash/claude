// Acesso a dados de doses/medicamentos. A autorização real é o RLS no banco
// (paciente só lê/escreve as próprias linhas) — aqui só montamos as queries.

import type { DoseLog, Medication } from '@metalink/db';
import type { InjectionSite } from '@metalink/core';

import { supabase } from './supabase';

export async function fetchMedications(): Promise<Medication[]> {
  const { data, error } = await supabase.from('medications').select('*').order('brand_name');
  if (error) {
    throw error;
  }
  return (data ?? []) as Medication[];
}

export async function fetchRecentDoses(limit = 50): Promise<DoseLog[]> {
  const { data, error } = await supabase
    .from('dose_logs')
    .select('*')
    .order('taken_at', { ascending: false })
    .limit(limit);
  if (error) {
    throw error;
  }
  return (data ?? []) as DoseLog[];
}

export interface NewDoseInput {
  medicationId: string;
  doseMg: number;
  takenAt: Date;
  injectionSite: InjectionSite | null;
  notes: string | null;
}

export async function insertDose(input: NewDoseInput): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('not_authenticated');
  }
  const { error } = await supabase.from('dose_logs').insert({
    patient_id: user.id,
    medication_id: input.medicationId,
    dose_mg: input.doseMg,
    taken_at: input.takenAt.toISOString(),
    injection_site: input.injectionSite,
    notes: input.notes,
  });
  if (error) {
    throw error;
  }
}
