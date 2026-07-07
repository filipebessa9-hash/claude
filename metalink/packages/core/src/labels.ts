// Labels pt-BR compartilhados entre o app do paciente e o painel do médico.
// Toda string exibida ao usuário para valores de enum vive aqui (Seção 8 do CLAUDE.md).

import type {
  ConsentType,
  InjectionSite,
  LinkStatus,
  MedicationRoute,
  SymptomSeverity,
  SymptomType,
  UserRole,
} from './types';

export const userRoleLabels: Record<UserRole, string> = {
  patient: 'Paciente',
  provider: 'Médico(a)',
  clinic_admin: 'Administrador(a) da clínica',
};

export const medicationRouteLabels: Record<MedicationRoute, string> = {
  weekly_injectable: 'Injetável semanal',
  daily_injectable: 'Injetável diário',
  oral: 'Oral (comprimido)',
};

export const injectionSiteLabels: Record<InjectionSite, string> = {
  abdomen_left: 'Abdômen (lado esquerdo)',
  abdomen_right: 'Abdômen (lado direito)',
  thigh_left: 'Coxa esquerda',
  thigh_right: 'Coxa direita',
  arm_left: 'Braço esquerdo',
  arm_right: 'Braço direito',
};

export const symptomTypeLabels: Record<SymptomType, string> = {
  nausea: 'Náusea',
  vomiting: 'Vômito',
  constipation: 'Constipação',
  diarrhea: 'Diarreia',
  abdominal_pain: 'Dor abdominal',
  reflux: 'Refluxo / azia',
  fatigue: 'Cansaço',
  headache: 'Dor de cabeça',
  other: 'Outro',
};

export const symptomSeverityLabels: Record<SymptomSeverity, string> = {
  mild: 'Leve',
  moderate: 'Moderado',
  severe: 'Intenso',
};

export const linkStatusLabels: Record<LinkStatus, string> = {
  pending: 'Aguardando confirmação',
  active: 'Ativo',
  revoked: 'Revogado',
};

export const consentTypeLabels: Record<ConsentType, string> = {
  terms: 'Termos de uso',
  privacy: 'Política de privacidade',
  provider_sharing: 'Compartilhamento de dados com o médico',
};

/**
 * Disclaimer obrigatório em toda tela que exibir o nível estimado de
 * medicação (Seção 6 do CLAUDE.md). Centralizado para nunca divergir.
 */
export const PK_ESTIMATE_DISCLAIMER =
  'Estimativa educativa. Não é medição real nem recomendação de dose. Consulte seu médico.';
