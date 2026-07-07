-- MetaLink — Fatia 0: esquema inicial
-- Entidades aprovadas na revisão de plano (CLAUDE.md Seção 10, item 2).
-- Dados de saúde são sensíveis (LGPD): minimização de dados aplicada ao desenho.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('patient', 'provider', 'clinic_admin');
create type medication_route as enum ('weekly_injectable', 'daily_injectable', 'oral');
create type injection_site as enum (
  'abdomen_left', 'abdomen_right', 'thigh_left', 'thigh_right', 'arm_left', 'arm_right'
);
create type symptom_type as enum (
  'nausea', 'vomiting', 'constipation', 'diarrhea', 'abdominal_pain',
  'reflux', 'fatigue', 'headache', 'other'
);
create type symptom_severity as enum ('mild', 'moderate', 'severe');
create type link_status as enum ('pending', 'active', 'revoked');
create type consent_type as enum ('terms', 'privacy', 'provider_sharing');

-- ---------------------------------------------------------------------------
-- Identidade e papéis
-- ---------------------------------------------------------------------------
create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.patients (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  -- Minimização LGPD: ano de nascimento (não data completa) e altura bastam para o MVP.
  birth_year smallint check (birth_year between 1900 and 2100),
  height_cm numeric(5, 1) check (height_cm between 50 and 260),
  created_at timestamptz not null default now()
);

create table public.providers (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  crm text,
  specialty text,
  clinic_id uuid references public.clinics (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Medicamentos (tabela de referência, populada via seed)
-- ---------------------------------------------------------------------------
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null unique,
  active_ingredient text not null,
  route medication_route not null,
  half_life_hours numeric(6, 1) not null check (half_life_hours > 0),
  -- Esquema de titulação típico, ex.: [{"dose_mg":0.25,"weeks":4}, ...]
  typical_titration jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Esquema ativo do paciente — base do cálculo de aderência (doses esperadas).
create table public.patient_medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (profile_id) on delete cascade,
  medication_id uuid not null references public.medications (id),
  current_dose_mg numeric(6, 2) not null check (current_dose_mg > 0),
  frequency medication_route not null,
  start_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index patient_medications_patient_idx on public.patient_medications (patient_id);

-- ---------------------------------------------------------------------------
-- Registros do paciente
-- ---------------------------------------------------------------------------
create table public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (profile_id) on delete cascade,
  medication_id uuid not null references public.medications (id),
  dose_mg numeric(6, 2) not null check (dose_mg > 0),
  taken_at timestamptz not null,
  injection_site injection_site,
  notes text,
  created_at timestamptz not null default now()
);
create index dose_logs_patient_taken_idx on public.dose_logs (patient_id, taken_at desc);

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (profile_id) on delete cascade,
  weight_kg numeric(5, 2) not null check (weight_kg between 20 and 400),
  measured_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index weight_logs_patient_measured_idx on public.weight_logs (patient_id, measured_at desc);

create table public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (profile_id) on delete cascade,
  symptom symptom_type not null,
  severity symptom_severity not null,
  occurred_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);
create index symptom_logs_patient_occurred_idx on public.symptom_logs (patient_id, occurred_at desc);

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (profile_id) on delete cascade,
  checkin_date date not null,
  -- Check-in leve: todos os campos opcionais (Seção 3). Escalas 1–5.
  hunger smallint check (hunger between 1 and 5),
  food_noise smallint check (food_noise between 1 and 5),
  mood smallint check (mood between 1 and 5),
  energy smallint check (energy between 1 and 5),
  hydration_ok boolean,
  protein_ok boolean,
  created_at timestamptz not null default now(),
  unique (patient_id, checkin_date)
);

-- ---------------------------------------------------------------------------
-- Vínculo paciente ↔ médico e consentimento
-- ---------------------------------------------------------------------------
create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (profile_id) on delete cascade,
  code text not null unique,
  expires_at timestamptz,
  max_uses integer not null default 1 check (max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  created_at timestamptz not null default now()
);

create table public.patient_provider_links (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (profile_id) on delete cascade,
  provider_id uuid not null references public.providers (profile_id) on delete cascade,
  status link_status not null default 'pending',
  consented_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (patient_id, provider_id)
);

-- Trilha imutável de consentimento (LGPD): apenas INSERT; revogação = novo
-- registro com granted = false.
create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (profile_id) on delete cascade,
  consent_type consent_type not null,
  granted boolean not null,
  document_version text not null default 'v0',
  created_at timestamptz not null default now()
);
create index consent_records_patient_type_idx
  on public.consent_records (patient_id, consent_type, created_at desc);

-- ---------------------------------------------------------------------------
-- Auditoria de acesso a dados de paciente (Seção 7)
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  patient_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_patient_idx on public.audit_logs (patient_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Criação automática de perfil no signup.
-- O papel vem de raw_user_meta_data.role; 'clinic_admin' nunca pode ser
-- auto-atribuído (só via backoffice/service role).
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
begin
  v_role := coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'patient')::user_role;
  if v_role = 'clinic_admin' then
    v_role := 'patient';
  end if;

  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  if v_role = 'patient' then
    insert into public.patients (profile_id) values (new.id);
  elsif v_role = 'provider' then
    insert into public.providers (profile_id, crm)
    values (new.id, nullif(new.raw_user_meta_data ->> 'crm', ''));
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Papel não pode ser alterado pelo próprio usuário (escalada de privilégio).
create function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'role change is not allowed';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();
