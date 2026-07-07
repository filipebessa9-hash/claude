// Acesso a dados de peso, sintomas e check-in diário (Fatia 2).
// Autorização real no RLS; aqui só as queries.

import type { SymptomSeverity, SymptomType } from '@metalink/core';
import type { DailyCheckin, SymptomLog, WeightLog } from '@metalink/db';

import { supabase } from './supabase';

async function requireUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('not_authenticated');
  }
  return user.id;
}

export async function fetchWeightLogs(limit = 180): Promise<WeightLog[]> {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .order('measured_at', { ascending: false })
    .limit(limit);
  if (error) {
    throw error;
  }
  return (data ?? []) as WeightLog[];
}

export async function insertWeight(weightKg: number, measuredAt: Date): Promise<void> {
  const patientId = await requireUserId();
  const { error } = await supabase.from('weight_logs').insert({
    patient_id: patientId,
    weight_kg: weightKg,
    measured_at: measuredAt.toISOString(),
  });
  if (error) {
    throw error;
  }
}

export async function fetchSymptomLogs(limit = 100): Promise<SymptomLog[]> {
  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) {
    throw error;
  }
  return (data ?? []) as SymptomLog[];
}

export interface NewSymptomInput {
  symptom: SymptomType;
  severity: SymptomSeverity;
  occurredAt: Date;
  notes: string | null;
}

export async function insertSymptom(input: NewSymptomInput): Promise<void> {
  const patientId = await requireUserId();
  const { error } = await supabase.from('symptom_logs').insert({
    patient_id: patientId,
    symptom: input.symptom,
    severity: input.severity,
    occurred_at: input.occurredAt.toISOString(),
    notes: input.notes,
  });
  if (error) {
    throw error;
  }
}

export async function fetchCheckin(checkinDate: string): Promise<DailyCheckin | null> {
  const { data, error } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('checkin_date', checkinDate)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as DailyCheckin | null) ?? null;
}

export interface CheckinInput {
  checkinDate: string;
  hunger: number | null;
  foodNoise: number | null;
  mood: number | null;
  energy: number | null;
  hydrationOk: boolean | null;
  proteinOk: boolean | null;
}

export async function upsertCheckin(input: CheckinInput): Promise<void> {
  const patientId = await requireUserId();
  const { error } = await supabase.from('daily_checkins').upsert(
    {
      patient_id: patientId,
      checkin_date: input.checkinDate,
      hunger: input.hunger,
      food_noise: input.foodNoise,
      mood: input.mood,
      energy: input.energy,
      hydration_ok: input.hydrationOk,
      protein_ok: input.proteinOk,
    },
    { onConflict: 'patient_id,checkin_date' },
  );
  if (error) {
    throw error;
  }
}
