-- MetaLink — Fatia 0: Row Level Security
-- Regra de ouro (Seção 7): paciente só acessa os próprios dados; médico só
-- acessa pacientes com vínculo ATIVO **e** consentimento de compartilhamento
-- vigente. A autorização vive no banco, não na UI.

-- ---------------------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------------------

-- O médico autenticado tem acesso aos dados deste paciente?
-- security definer para poder consultar links/consentimentos sem depender
-- das políticas dessas tabelas (evita recursão de RLS).
create function public.provider_has_access(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patient_provider_links l
    where l.provider_id = auth.uid()
      and l.patient_id = p_patient_id
      and l.status = 'active'
  )
  and coalesce(
    (
      select c.granted
      from public.consent_records c
      where c.patient_id = p_patient_id
        and c.consent_type = 'provider_sharing'
      order by c.created_at desc
      limit 1
    ),
    false
  );
$$;

-- Registro de auditoria de acesso a dados de paciente. A camada de aplicação
-- (painel do médico, geração de relatório) DEVE chamar esta função em todo
-- acesso de médico/admin a dados de um paciente (Seção 7).
create function public.log_patient_access(
  p_action text,
  p_resource_type text,
  p_patient_id uuid,
  p_resource_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs (actor_id, action, resource_type, resource_id, patient_id, metadata)
  values (auth.uid(), p_action, p_resource_type, p_resource_id, p_patient_id, p_metadata);
$$;

revoke execute on function public.provider_has_access(uuid) from public;
revoke execute on function public.log_patient_access(text, text, uuid, uuid, jsonb) from public;
grant execute on function public.provider_has_access(uuid) to authenticated;
grant execute on function public.log_patient_access(text, text, uuid, uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Habilita RLS em todas as tabelas (negar por padrão)
-- ---------------------------------------------------------------------------
alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.providers enable row level security;
alter table public.medications enable row level security;
alter table public.patient_medications enable row level security;
alter table public.dose_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.invite_codes enable row level security;
alter table public.patient_provider_links enable row level security;
alter table public.consent_records enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Médico vê o perfil (nome) de pacientes vinculados; paciente vê o perfil
-- dos médicos aos quais está vinculado (qualquer status, para a tela de vínculo).
create policy profiles_select_linked on public.profiles
  for select to authenticated
  using (
    public.provider_has_access(id)
    or exists (
      select 1 from public.patient_provider_links l
      where l.patient_id = auth.uid() and l.provider_id = profiles.id
    )
  );

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- patients / providers
-- ---------------------------------------------------------------------------
create policy patients_own on public.patients
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy patients_provider_read on public.patients
  for select to authenticated
  using (public.provider_has_access(profile_id));

create policy providers_own on public.providers
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy providers_select_linked on public.providers
  for select to authenticated
  using (
    exists (
      select 1 from public.patient_provider_links l
      where l.patient_id = auth.uid() and l.provider_id = providers.profile_id
    )
  );

-- ---------------------------------------------------------------------------
-- medications: catálogo público para qualquer usuário autenticado (só leitura)
-- ---------------------------------------------------------------------------
create policy medications_read on public.medications
  for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Dados clínicos do paciente: paciente CRUD nos próprios; médico só leitura
-- via provider_has_access (vínculo ativo + consentimento).
-- ---------------------------------------------------------------------------
create policy patient_medications_own on public.patient_medications
  for all to authenticated
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

create policy patient_medications_provider_read on public.patient_medications
  for select to authenticated
  using (public.provider_has_access(patient_id));

create policy dose_logs_own on public.dose_logs
  for all to authenticated
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

create policy dose_logs_provider_read on public.dose_logs
  for select to authenticated
  using (public.provider_has_access(patient_id));

create policy weight_logs_own on public.weight_logs
  for all to authenticated
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

create policy weight_logs_provider_read on public.weight_logs
  for select to authenticated
  using (public.provider_has_access(patient_id));

create policy symptom_logs_own on public.symptom_logs
  for all to authenticated
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

create policy symptom_logs_provider_read on public.symptom_logs
  for select to authenticated
  using (public.provider_has_access(patient_id));

create policy daily_checkins_own on public.daily_checkins
  for all to authenticated
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

create policy daily_checkins_provider_read on public.daily_checkins
  for select to authenticated
  using (public.provider_has_access(patient_id));

-- ---------------------------------------------------------------------------
-- invite_codes: médico gerencia os próprios códigos. O resgate pelo paciente
-- será via função RPC security definer na Fatia 3 (não expõe a tabela).
-- ---------------------------------------------------------------------------
create policy invite_codes_provider on public.invite_codes
  for all to authenticated
  using (provider_id = auth.uid())
  with check (provider_id = auth.uid());

-- ---------------------------------------------------------------------------
-- patient_provider_links: cada lado vê os próprios vínculos. Paciente pode
-- revogar (update). Criação de vínculo será via RPC de resgate (Fatia 3).
-- ---------------------------------------------------------------------------
create policy links_patient_select on public.patient_provider_links
  for select to authenticated
  using (patient_id = auth.uid());

create policy links_provider_select on public.patient_provider_links
  for select to authenticated
  using (provider_id = auth.uid());

create policy links_patient_update on public.patient_provider_links
  for update to authenticated
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

-- ---------------------------------------------------------------------------
-- consent_records: trilha imutável — paciente só insere e lê os próprios.
-- Sem políticas de UPDATE/DELETE (negados por padrão pelo RLS).
-- ---------------------------------------------------------------------------
create policy consent_insert_own on public.consent_records
  for insert to authenticated
  with check (patient_id = auth.uid());

create policy consent_select_own on public.consent_records
  for select to authenticated
  using (patient_id = auth.uid());

-- ---------------------------------------------------------------------------
-- audit_logs: nenhum acesso direto para authenticated (negado por padrão).
-- Escrita apenas via log_patient_access(); leitura via service role/backoffice.
-- ---------------------------------------------------------------------------
