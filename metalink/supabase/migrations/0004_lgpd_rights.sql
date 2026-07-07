-- MetaLink — Fatia 7: direitos do titular (LGPD) e consentimento no cadastro.

-- ---------------------------------------------------------------------------
-- Direito de acesso/portabilidade: o paciente exporta TODOS os próprios dados
-- em JSON. A exportação em si é registrada na auditoria.
-- ---------------------------------------------------------------------------
create function public.export_patient_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient uuid := auth.uid();
  v_result jsonb;
begin
  if v_patient is null or not exists (select 1 from patients where profile_id = v_patient) then
    raise exception 'only_patients_can_export';
  end if;

  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from profiles p where p.id = v_patient),
    'patient', (select to_jsonb(pa) from patients pa where pa.profile_id = v_patient),
    'dose_logs', coalesce(
      (select jsonb_agg(to_jsonb(d) order by d.taken_at) from dose_logs d
        where d.patient_id = v_patient), '[]'::jsonb),
    'weight_logs', coalesce(
      (select jsonb_agg(to_jsonb(w) order by w.measured_at) from weight_logs w
        where w.patient_id = v_patient), '[]'::jsonb),
    'symptom_logs', coalesce(
      (select jsonb_agg(to_jsonb(s) order by s.occurred_at) from symptom_logs s
        where s.patient_id = v_patient), '[]'::jsonb),
    'daily_checkins', coalesce(
      (select jsonb_agg(to_jsonb(c) order by c.checkin_date) from daily_checkins c
        where c.patient_id = v_patient), '[]'::jsonb),
    'patient_provider_links', coalesce(
      (select jsonb_agg(to_jsonb(l) order by l.created_at) from patient_provider_links l
        where l.patient_id = v_patient), '[]'::jsonb),
    'consent_records', coalesce(
      (select jsonb_agg(to_jsonb(cr) order by cr.created_at) from consent_records cr
        where cr.patient_id = v_patient), '[]'::jsonb)
  ) into v_result;

  insert into audit_logs (actor_id, action, resource_type, patient_id)
  values (v_patient, 'export_own_data', 'patient_data', v_patient);

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Direito de eliminação: apaga a conta do paciente. O DELETE em auth.users
-- cascateia por profiles → patients → todos os registros clínicos e vínculos.
-- audit_logs não tem FK de propósito: a trilha sobrevive com o uuid órfão
-- (não identificável após a eliminação).
-- ASSUMPTION: exclusão self-service só para paciente; conta de médico é
-- removida via backoffice/suporte no MVP.
-- ---------------------------------------------------------------------------
create function public.delete_patient_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_patient uuid := auth.uid();
begin
  if v_patient is null or not exists (select 1 from patients where profile_id = v_patient) then
    raise exception 'only_patients_can_delete_account';
  end if;

  insert into audit_logs (actor_id, action, resource_type, patient_id)
  values (v_patient, 'account_deleted', 'auth_user', v_patient);

  delete from auth.users where id = v_patient;
end;
$$;

revoke execute on function public.export_patient_data() from public;
revoke execute on function public.delete_patient_account() from public;
grant execute on function public.export_patient_data() to authenticated;
grant execute on function public.delete_patient_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Consentimento no cadastro: o app só envia o signup com o aceite marcado
-- (accepted_terms = 'true' nos metadados); o trigger registra termos e
-- privacidade na trilha imutável. Consentimento de médico fica registrado
-- nos metadados do auth.users (consent_records é escopado a paciente).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
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
    if coalesce(new.raw_user_meta_data ->> 'accepted_terms', '') = 'true' then
      insert into public.consent_records (patient_id, consent_type, granted, document_version)
      values (new.id, 'terms', true, 'v0'), (new.id, 'privacy', true, 'v0');
    end if;
  elsif v_role = 'provider' then
    insert into public.providers (profile_id, crm)
    values (new.id, nullif(new.raw_user_meta_data ->> 'crm', ''));
  end if;

  return new;
end;
$$;
