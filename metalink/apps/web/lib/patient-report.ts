// Montagem dos dados do painel/relatório de um paciente (Fatia 4).
// A autorização real é o RLS: se o médico não tem vínculo ativo + consentimento,
// as queries voltam vazias e o perfil não aparece → tratamos como "sem acesso".

import {
  buildAlertFlags,
  buildPkCurve,
  computeAdherence,
  estimateLevelAt,
  intervalDaysForRoute,
  relativeLevelPct,
  summarizeCheckins,
  summarizeWeightTrend,
  type AdherenceSummary,
  type AlertFlag,
  type CheckinSummary,
  type PkPoint,
  type WeightPoint,
  type WeightTrendSummary,
} from '@metalink/core';
import type { DailyCheckin, DoseLog, Medication, Patient, SymptomLog } from '@metalink/db';
import type { SupabaseClient } from '@supabase/supabase-js';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PatientReport {
  patientId: string;
  patientName: string;
  birthYear: number | null;
  heightCm: number | null;
  generatedAt: Date;
  medicationsById: Map<string, Medication>;
  doses: DoseLog[]; // últimos 90 dias, mais recentes primeiro
  weightPoints: WeightPoint[]; // últimos 180 dias, ordem cronológica
  weightSummary: WeightTrendSummary | null;
  symptoms: SymptomLog[]; // últimos 30 dias, mais recentes primeiro
  adherence: AdherenceSummary | null;
  checkinSummary: CheckinSummary; // últimos 14 dias
  flags: AlertFlag[];
  /** Curva PK dos últimos 30 dias do medicamento mais recente; null sem doses. */
  pkCurve: PkPoint[] | null;
  pkRelativePct: number | null;
  pkMedicationName: string | null;
}

/**
 * Registra na auditoria o acesso do médico aos dados do paciente (Seção 7).
 * Falha de auditoria não pode vazar dados nos logs — só sinalizamos o erro.
 */
export async function logPatientAccess(
  supabase: SupabaseClient,
  action: string,
  patientId: string,
): Promise<void> {
  const { error } = await supabase.rpc('log_patient_access', {
    p_action: action,
    p_resource_type: 'patient_report',
    p_patient_id: patientId,
  });
  if (error) {
    console.error('audit log failed', { action });
  }
}

export async function fetchPatientReport(
  supabase: SupabaseClient,
  patientId: string,
): Promise<PatientReport | null> {
  const now = new Date();
  const since = (days: number) => new Date(now.getTime() - days * DAY_MS).toISOString();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', patientId)
    .maybeSingle();
  if (!profile) {
    return null; // RLS negou: sem vínculo ativo + consentimento.
  }

  const [patientRes, medsRes, dosesRes, weightsRes, symptomsRes, checkinsRes] = await Promise.all([
    supabase.from('patients').select('*').eq('profile_id', patientId).maybeSingle(),
    supabase.from('medications').select('*'),
    supabase
      .from('dose_logs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('taken_at', since(90))
      .order('taken_at', { ascending: false }),
    supabase
      .from('weight_logs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('measured_at', since(180))
      .order('measured_at', { ascending: true }),
    supabase
      .from('symptom_logs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('occurred_at', since(30))
      .order('occurred_at', { ascending: false }),
    supabase
      .from('daily_checkins')
      .select('*')
      .eq('patient_id', patientId)
      .gte('checkin_date', since(14).slice(0, 10)),
  ]);

  const patient = (patientRes.data as Patient | null) ?? null;
  const medications = (medsRes.data ?? []) as Medication[];
  const doses = (dosesRes.data ?? []) as DoseLog[];
  const weights = (weightsRes.data ?? []) as { weight_kg: number; measured_at: string }[];
  const symptoms = (symptomsRes.data ?? []) as SymptomLog[];
  const checkins = (checkinsRes.data ?? []) as DailyCheckin[];

  const medicationsById = new Map(medications.map((m) => [m.id, m]));
  const weightPoints: WeightPoint[] = weights.map((w) => ({
    measuredAt: new Date(w.measured_at),
    weightKg: Number(w.weight_kg),
  }));

  // Esquema inferido da via do medicamento da dose mais recente.
  const lastDoseMedication = doses[0] ? medicationsById.get(doses[0].medication_id) : undefined;
  const adherence = lastDoseMedication
    ? computeAdherence(
        doses.map((d) => new Date(d.taken_at)),
        { intervalDays: intervalDaysForRoute(lastDoseMedication.route), now },
      )
    : null;

  const weightSummary = summarizeWeightTrend(weightPoints, now);
  const checkinSummary = summarizeCheckins(
    checkins.map((c) => ({
      hunger: c.hunger,
      foodNoise: c.food_noise,
      mood: c.mood,
      energy: c.energy,
      hydrationOk: c.hydration_ok,
      proteinOk: c.protein_ok,
    })),
  );
  const flags = buildAlertFlags({
    weightSummary,
    symptoms: symptoms.map((s) => ({
      symptom: s.symptom,
      severity: s.severity,
      occurredAt: new Date(s.occurred_at),
    })),
    adherence,
    now,
  });

  // Nível estimado (Seção 6): curva PK do medicamento mais recente, 30 dias.
  let pkCurve: PkPoint[] | null = null;
  let pkRelativePct: number | null = null;
  let pkMedicationName: string | null = null;
  if (lastDoseMedication) {
    const pkDoses = doses
      .filter((d) => d.medication_id === lastDoseMedication.id)
      .map((d) => ({ takenAt: new Date(d.taken_at), doseMg: Number(d.dose_mg) }));
    const halfLife = Number(lastDoseMedication.half_life_hours);
    pkCurve = buildPkCurve(pkDoses, halfLife, {
      from: new Date(now.getTime() - 30 * DAY_MS),
      to: now,
      stepHours: 6,
    });
    pkRelativePct = relativeLevelPct(pkCurve, estimateLevelAt(pkDoses, halfLife, now));
    pkMedicationName = lastDoseMedication.brand_name;
  }

  return {
    patientId,
    patientName: profile.full_name || 'Paciente',
    birthYear: patient?.birth_year ?? null,
    heightCm:
      patient?.height_cm !== null && patient?.height_cm !== undefined
        ? Number(patient.height_cm)
        : null,
    generatedAt: now,
    medicationsById,
    doses,
    weightPoints,
    weightSummary,
    symptoms,
    adherence,
    checkinSummary,
    flags,
    pkCurve,
    pkRelativePct,
    pkMedicationName,
  };
}
