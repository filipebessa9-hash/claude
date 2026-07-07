import { redirect } from 'next/navigation';

import { userRoleLabels } from '@metalink/core';
import type { UserRole } from '@metalink/core';

import { createClient } from '@/lib/supabase/server';

import { InviteGenerator } from './invite-generator';

async function signOut() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

interface LinkRow {
  id: string;
  patient_id: string;
  created_at: string;
}

interface InviteCodeRow {
  id: string;
  code: string;
  expires_at: string | null;
  max_uses: number;
  use_count: number;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  const role = profile.role as UserRole;

  if (role !== 'provider') {
    return (
      <main className="centered">
        <h1>MetaLink</h1>
        <p>
          Olá, <strong>{profile.full_name || user.email}</strong> ({userRoleLabels[role]})
        </p>
        <p className="info">
          Este painel é para médicos(as). Como paciente, use o aplicativo MetaLink no seu celular.
        </p>
        <form action={signOut}>
          <button type="submit">Sair</button>
        </form>
      </main>
    );
  }

  // RLS: só retorna vínculos deste médico.
  const { data: links } = await supabase
    .from('patient_provider_links')
    .select('id, patient_id, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  const activeLinks = (links ?? []) as LinkRow[];

  // RLS: nomes só de pacientes com vínculo ativo + consentimento vigente.
  const patientIds = activeLinks.map((link) => link.patient_id);
  const { data: patientProfiles } = patientIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', patientIds)
    : { data: [] };
  const nameById = new Map(
    ((patientProfiles ?? []) as { id: string; full_name: string }[]).map((p) => [
      p.id,
      p.full_name,
    ]),
  );

  const { data: codes } = await supabase
    .from('invite_codes')
    .select('id, code, expires_at, max_uses, use_count')
    .order('created_at', { ascending: false })
    .limit(10);
  const inviteCodes = (codes ?? []) as InviteCodeRow[];

  return (
    <main className="centered wide">
      <h1>MetaLink — Painel do médico</h1>
      <p>
        Olá, <strong>{profile.full_name || user.email}</strong>
      </p>

      <section>
        <h2>Convidar paciente</h2>
        <p className="info">
          Gere um código e envie ao paciente. Ele digita o código no app e autoriza o
          compartilhamento — só então os dados aparecem aqui.
        </p>
        <InviteGenerator />
        {inviteCodes.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Usos</th>
                <th>Expira em</th>
              </tr>
            </thead>
            <tbody>
              {inviteCodes.map((code) => (
                <tr key={code.id}>
                  <td>
                    <code>{code.code}</code>
                  </td>
                  <td>
                    {code.use_count}/{code.max_uses}
                  </td>
                  <td>
                    {code.expires_at
                      ? new Date(code.expires_at).toLocaleDateString('pt-BR')
                      : 'Sem expiração'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Pacientes vinculados</h2>
        {activeLinks.length === 0 ? (
          <p className="info">
            Nenhum paciente vinculado ainda. Assim que um paciente aceitar seu convite, ele aparece
            aqui.
          </p>
        ) : (
          <ul className="patient-list">
            {activeLinks.map((link) => (
              <li key={link.id}>
                <strong>{nameById.get(link.patient_id) ?? 'Paciente'}</strong>
                <span className="info">
                  {' '}
                  — vinculado em {new Date(link.created_at).toLocaleDateString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="info">O painel detalhado por paciente chega na próxima etapa.</p>
      </section>

      <form action={signOut}>
        <button type="submit">Sair</button>
      </form>
    </main>
  );
}
