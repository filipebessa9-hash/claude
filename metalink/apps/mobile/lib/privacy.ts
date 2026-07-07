// Direitos do titular (LGPD, Fatia 7): exportação, revogação de
// compartilhamento e exclusão de conta.

import { supabase } from './supabase';

export async function exportMyData(): Promise<string> {
  const { data, error } = await supabase.rpc('export_patient_data');
  if (error) {
    throw error;
  }
  return JSON.stringify(data, null, 2);
}

/**
 * Revoga TODO o compartilhamento com médicos: registra consentimento negativo
 * na trilha imutável (corta o acesso via RLS na hora) e marca os vínculos
 * ativos como revogados.
 */
export async function revokeAllSharing(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('not_authenticated');
  }
  const { error: consentError } = await supabase.from('consent_records').insert({
    patient_id: user.id,
    consent_type: 'provider_sharing',
    granted: false,
  });
  if (consentError) {
    throw consentError;
  }
  const { error: linkError } = await supabase
    .from('patient_provider_links')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('status', 'active');
  if (linkError) {
    throw linkError;
  }
}

export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_patient_account');
  if (error) {
    throw error;
  }
  await supabase.auth.signOut();
}
