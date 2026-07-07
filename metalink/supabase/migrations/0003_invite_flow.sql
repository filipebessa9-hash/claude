-- MetaLink — Fatia 3: fluxo de convite paciente ↔ médico.
-- Todo o fluxo roda em funções security definer para ser atômico e não expor
-- a tabela invite_codes ao paciente. O consentimento entra na trilha imutável
-- no momento do resgate (LGPD: consentimento explícito e datado).

-- Normalização compartilhada do código: remove espaços/hífens, caixa alta e
-- corrige confusões de leitura (O→0, I/L→1). Espelhada em @metalink/core.
create function public.normalize_invite_code(p_code text)
returns text
language sql
immutable
as $$
  select translate(upper(regexp_replace(p_code, '[\s-]', '', 'g')), 'OIL', '011');
$$;

-- ---------------------------------------------------------------------------
-- Médico gera um código de convite (8 caracteres hex, sem ambiguidade após
-- normalização). Entropia de 32 bits é suficiente: código expira, tem limite
-- de usos e só ativa compartilhamento com consentimento do paciente.
-- ---------------------------------------------------------------------------
create function public.create_invite_code(
  p_expires_in_days integer default 14,
  p_max_uses integer default 1
)
returns public.invite_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_row public.invite_codes;
begin
  if not exists (select 1 from providers where profile_id = auth.uid()) then
    raise exception 'only_providers_can_create_invites';
  end if;
  if p_expires_in_days is null or p_expires_in_days < 1 or p_expires_in_days > 90 then
    raise exception 'invalid_expires_in_days';
  end if;
  if p_max_uses is null or p_max_uses < 1 or p_max_uses > 100 then
    raise exception 'invalid_max_uses';
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into invite_codes (provider_id, code, expires_at, max_uses)
      values (auth.uid(), v_code, now() + make_interval(days => p_expires_in_days), p_max_uses)
      returning * into v_row;
      return v_row;
    exception
      when unique_violation then
        -- colisão de código: tenta outro
    end;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Valida um código e devolve quem está convidando, SEM resgatar — o app
-- mostra isso na tela de consentimento antes de o paciente confirmar.
-- ---------------------------------------------------------------------------
create function public.preview_invite_code(p_code text)
returns table (provider_name text, provider_crm text, clinic_name text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v public.invite_codes;
begin
  select * into v from invite_codes where code = normalize_invite_code(p_code);
  if v.id is null then
    raise exception 'invite_not_found';
  end if;
  if v.expires_at is not null and v.expires_at < now() then
    raise exception 'invite_expired';
  end if;
  if v.use_count >= v.max_uses then
    raise exception 'invite_exhausted';
  end if;

  return query
    select p.full_name, pr.crm, c.name
    from providers pr
    join profiles p on p.id = pr.profile_id
    left join clinics c on c.id = pr.clinic_id
    where pr.profile_id = v.provider_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Paciente resgata o código: ativa (ou reativa) o vínculo, registra o
-- consentimento de compartilhamento na trilha imutável, consome um uso do
-- código e audita — tudo na mesma transação.
-- ---------------------------------------------------------------------------
create function public.redeem_invite_code(p_code text)
returns public.patient_provider_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.invite_codes;
  v_link public.patient_provider_links;
begin
  if not exists (select 1 from patients where profile_id = auth.uid()) then
    raise exception 'only_patients_can_redeem';
  end if;

  select * into v from invite_codes where code = normalize_invite_code(p_code) for update;
  if v.id is null then
    raise exception 'invite_not_found';
  end if;
  if v.expires_at is not null and v.expires_at < now() then
    raise exception 'invite_expired';
  end if;
  if v.use_count >= v.max_uses then
    raise exception 'invite_exhausted';
  end if;

  insert into patient_provider_links (patient_id, provider_id, status, consented_at)
  values (auth.uid(), v.provider_id, 'active', now())
  on conflict (patient_id, provider_id)
    do update set status = 'active', consented_at = now(), revoked_at = null
  returning * into v_link;

  insert into consent_records (patient_id, consent_type, granted, document_version)
  values (auth.uid(), 'provider_sharing', true, 'v0');

  update invite_codes set use_count = use_count + 1 where id = v.id;

  insert into audit_logs (actor_id, action, resource_type, resource_id, patient_id)
  values (auth.uid(), 'redeem_invite', 'patient_provider_links', v_link.id, auth.uid());

  return v_link;
end;
$$;

revoke execute on function public.normalize_invite_code(text) from public;
revoke execute on function public.create_invite_code(integer, integer) from public;
revoke execute on function public.preview_invite_code(text) from public;
revoke execute on function public.redeem_invite_code(text) from public;
grant execute on function public.normalize_invite_code(text) to authenticated;
grant execute on function public.create_invite_code(integer, integer) to authenticated;
grant execute on function public.preview_invite_code(text) to authenticated;
grant execute on function public.redeem_invite_code(text) to authenticated;
