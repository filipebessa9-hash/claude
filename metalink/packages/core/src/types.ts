// Tipos de domínio espelhando os enums do banco (supabase/migrations).
// Mantenha os dois em sincronia — o banco é a fonte de verdade.

export const USER_ROLES = ['patient', 'provider', 'clinic_admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MEDICATION_ROUTES = ['weekly_injectable', 'daily_injectable', 'oral'] as const;
export type MedicationRoute = (typeof MEDICATION_ROUTES)[number];

export const INJECTION_SITES = [
  'abdomen_left',
  'abdomen_right',
  'thigh_left',
  'thigh_right',
  'arm_left',
  'arm_right',
] as const;
export type InjectionSite = (typeof INJECTION_SITES)[number];

export const SYMPTOM_TYPES = [
  'nausea',
  'vomiting',
  'constipation',
  'diarrhea',
  'abdominal_pain',
  'reflux',
  'fatigue',
  'headache',
  'other',
] as const;
export type SymptomType = (typeof SYMPTOM_TYPES)[number];

export const SYMPTOM_SEVERITIES = ['mild', 'moderate', 'severe'] as const;
export type SymptomSeverity = (typeof SYMPTOM_SEVERITIES)[number];

export const LINK_STATUSES = ['pending', 'active', 'revoked'] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

export const CONSENT_TYPES = ['terms', 'privacy', 'provider_sharing'] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];
