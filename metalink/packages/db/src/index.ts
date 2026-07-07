// Interfaces das tabelas do banco (espelham supabase/migrations).
// ASSUMPTION: na Fatia 1 estes tipos serão substituídos pelos gerados por
// `supabase gen types typescript`, quando o acesso tipado a dados começar.
// Na Fatia 0 os apps só usam auth, então interfaces manuais bastam.

import type {
  ConsentType,
  InjectionSite,
  LinkStatus,
  MedicationRoute,
  SymptomSeverity,
  SymptomType,
  UserRole,
} from '@metalink/core';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  created_at: string;
}

export interface Patient {
  profile_id: string;
  birth_year: number | null;
  height_cm: number | null;
  created_at: string;
}

export interface Provider {
  profile_id: string;
  crm: string | null;
  specialty: string | null;
  clinic_id: string | null;
  created_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  created_at: string;
}

export interface Medication {
  id: string;
  brand_name: string;
  active_ingredient: string;
  route: MedicationRoute;
  half_life_hours: number;
  typical_titration: { dose_mg: number; weeks: number | null }[];
  created_at: string;
}

export interface PatientMedication {
  id: string;
  patient_id: string;
  medication_id: string;
  current_dose_mg: number;
  frequency: MedicationRoute;
  start_date: string;
  is_active: boolean;
  created_at: string;
}

export interface DoseLog {
  id: string;
  patient_id: string;
  medication_id: string;
  dose_mg: number;
  taken_at: string;
  injection_site: InjectionSite | null;
  notes: string | null;
  created_at: string;
}

export interface WeightLog {
  id: string;
  patient_id: string;
  weight_kg: number;
  measured_at: string;
  created_at: string;
}

export interface SymptomLog {
  id: string;
  patient_id: string;
  symptom: SymptomType;
  severity: SymptomSeverity;
  occurred_at: string;
  notes: string | null;
  created_at: string;
}

export interface DailyCheckin {
  id: string;
  patient_id: string;
  checkin_date: string;
  hunger: number | null;
  food_noise: number | null;
  mood: number | null;
  energy: number | null;
  hydration_ok: boolean | null;
  protein_ok: boolean | null;
  created_at: string;
}

export interface InviteCode {
  id: string;
  provider_id: string;
  code: string;
  expires_at: string | null;
  max_uses: number;
  use_count: number;
  created_at: string;
}

export interface PatientProviderLink {
  id: string;
  patient_id: string;
  provider_id: string;
  status: LinkStatus;
  consented_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface ConsentRecord {
  id: string;
  patient_id: string;
  consent_type: ConsentType;
  granted: boolean;
  document_version: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  patient_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
