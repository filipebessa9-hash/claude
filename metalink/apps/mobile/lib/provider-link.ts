// Vínculo paciente ↔ médico (Fatia 3). O fluxo de resgate roda em funções
// security definer no banco; aqui só as chamadas RPC e leituras via RLS.

import { normalizeInviteCode } from '@metalink/core';
import type { PatientProviderLink } from '@metalink/db';

import { supabase } from './supabase';

export interface LinkedProvider {
  link: PatientProviderLink;
  providerName: string;
  providerCrm: string | null;
}

export interface InvitePreview {
  providerName: string;
  providerCrm: string | null;
  clinicName: string | null;
}

/** Mapeia os erros das RPCs para mensagens pt-BR. */
export function inviteErrorMessage(message: string): string {
  if (message.includes('invite_not_found')) {
    return 'Código não encontrado. Confira com seu médico e tente de novo.';
  }
  if (message.includes('invite_expired')) {
    return 'Este código expirou. Peça um novo ao seu médico.';
  }
  if (message.includes('invite_exhausted')) {
    return 'Este código já foi utilizado. Peça um novo ao seu médico.';
  }
  return 'Não foi possível concluir. Tente novamente.';
}

export async function fetchLinkedProviders(): Promise<LinkedProvider[]> {
  const { data: links, error } = await supabase
    .from('patient_provider_links')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  const activeLinks = (links ?? []) as PatientProviderLink[];
  if (activeLinks.length === 0) {
    return [];
  }

  const providerIds = activeLinks.map((link) => link.provider_id);
  const [{ data: profiles }, { data: providers }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', providerIds),
    supabase.from('providers').select('profile_id, crm').in('profile_id', providerIds),
  ]);
  const nameById = new Map(
    ((profiles ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p.full_name]),
  );
  const crmById = new Map(
    ((providers ?? []) as { profile_id: string; crm: string | null }[]).map((p) => [
      p.profile_id,
      p.crm,
    ]),
  );

  return activeLinks.map((link) => ({
    link,
    providerName: nameById.get(link.provider_id) ?? 'Médico(a)',
    providerCrm: crmById.get(link.provider_id) ?? null,
  }));
}

export async function previewInvite(code: string): Promise<InvitePreview> {
  const { data, error } = await supabase.rpc('preview_invite_code', {
    p_code: normalizeInviteCode(code),
  });
  if (error) {
    throw new Error(error.message);
  }
  const row = (
    data as { provider_name: string; provider_crm: string | null; clinic_name: string | null }[]
  )[0];
  if (!row) {
    throw new Error('invite_not_found');
  }
  return {
    providerName: row.provider_name,
    providerCrm: row.provider_crm,
    clinicName: row.clinic_name,
  };
}

export async function redeemInvite(code: string): Promise<void> {
  const { error } = await supabase.rpc('redeem_invite_code', {
    p_code: normalizeInviteCode(code),
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function revokeLink(linkId: string): Promise<void> {
  const { error } = await supabase
    .from('patient_provider_links')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', linkId);
  if (error) {
    throw error;
  }
}
