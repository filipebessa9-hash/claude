import { redirect } from 'next/navigation';

import { userRoleLabels } from '@metalink/core';
import type { UserRole } from '@metalink/core';

import { createClient } from '@/lib/supabase/server';

async function signOut() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
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

  return (
    <main className="centered">
      <h1>MetaLink</h1>
      <p>
        Olá, <strong>{profile.full_name || user.email}</strong> ({userRoleLabels[role]})
      </p>
      {role === 'provider' ? (
        <p className="info">
          Você ainda não tem pacientes vinculados. Na próxima etapa você poderá gerar códigos de
          convite para seus pacientes — o painel de acompanhamento aparecerá aqui.
        </p>
      ) : (
        <p className="info">
          Este painel é para médicos(as). Como paciente, use o aplicativo MetaLink no seu celular.
        </p>
      )}
      <form action={signOut}>
        <button type="submit">Sair</button>
      </form>
    </main>
  );
}
