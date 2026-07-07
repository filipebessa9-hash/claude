// E2E de API contra o stack local (GoTrue + PostgREST + RLS reais).

const URL_BASE = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anon = process.env.SUPABASE_ANON_KEY;
if (!anon) {
  console.error('Defina SUPABASE_ANON_KEY (e opcionalmente SUPABASE_URL).');
  process.exit(1);
}
let passed = 0,
  failed = 0;
function check(name, ok, extra = '') {
  if (ok) {
    passed++;
    console.log(`  PASS ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name} ${extra}`);
  }
}
async function api(path, { method = 'GET', token = anon, body, headers = {} } = {}) {
  const res = await fetch(`${URL_BASE}${path}`, {
    method,
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* sem corpo */
  }
  return { status: res.status, data };
}
async function signup(email, meta) {
  const { status, data } = await api('/auth/v1/signup', {
    method: 'POST',
    body: { email, password: 'senha-forte-123', data: meta },
  });
  if (status !== 200 || !data.access_token)
    throw new Error(`signup ${email}: ${status} ${JSON.stringify(data)}`);
  return { token: data.access_token, id: data.user.id };
}

console.log('1. Cadastro (Fatia 0/7)');
const marina = await signup(`marina.${Date.now()}@example.com`, {
  role: 'patient',
  full_name: 'Marina Teste',
  accepted_terms: 'true',
});
const bruno = await signup(`bruno.${Date.now()}@example.com`, {
  role: 'provider',
  full_name: 'Dr. Bruno Teste',
  crm: 'CRM-SP 999999',
});
const profileM = await api('/rest/v1/profiles?select=role,full_name', { token: marina.token });
check('perfil da paciente criado pelo trigger', profileM.data?.[0]?.role === 'patient');
const consents = await api('/rest/v1/consent_records?select=consent_type,granted', {
  token: marina.token,
});
check(
  'consentimento termos+privacidade registrado no signup',
  ['terms', 'privacy'].every((t) => consents.data?.some((c) => c.consent_type === t && c.granted)),
);

console.log('2. Registro de dose (Fatia 1)');
const meds = await api('/rest/v1/medications?select=id,brand_name&brand_name=eq.Ozempic', {
  token: marina.token,
});
check('catálogo de medicamentos visível para autenticado', meds.data?.length === 1);
const ozempic = meds.data[0].id;
const doseIns = await api('/rest/v1/dose_logs', {
  method: 'POST',
  token: marina.token,
  body: {
    patient_id: marina.id,
    medication_id: ozempic,
    dose_mg: 0.25,
    taken_at: new Date(Date.now() - 6 * 864e5).toISOString(),
    injection_site: 'abdomen_left',
  },
});
const doseIns2 = await api('/rest/v1/dose_logs', {
  method: 'POST',
  token: marina.token,
  body: {
    patient_id: marina.id,
    medication_id: ozempic,
    dose_mg: 0.25,
    taken_at: new Date().toISOString(),
    injection_site: 'abdomen_right',
  },
});
check('paciente registra doses', doseIns.status === 201 && doseIns2.status === 201);
const doseForOther = await api('/rest/v1/dose_logs', {
  method: 'POST',
  token: marina.token,
  body: {
    patient_id: bruno.id,
    medication_id: ozempic,
    dose_mg: 1,
    taken_at: new Date().toISOString(),
  },
});
check(
  'RLS bloqueia dose em nome de outro usuário',
  doseForOther.status === 403 || doseForOther.status === 401,
  `status=${doseForOther.status}`,
);

console.log('3. Peso, sintomas e check-in (Fatia 2)');
const w1 = await api('/rest/v1/weight_logs', {
  method: 'POST',
  token: marina.token,
  body: {
    patient_id: marina.id,
    weight_kg: 90.5,
    measured_at: new Date(Date.now() - 6 * 864e5).toISOString(),
  },
});
const w2 = await api('/rest/v1/weight_logs', {
  method: 'POST',
  token: marina.token,
  body: { patient_id: marina.id, weight_kg: 89.8, measured_at: new Date().toISOString() },
});
const sym = await api('/rest/v1/symptom_logs', {
  method: 'POST',
  token: marina.token,
  body: {
    patient_id: marina.id,
    symptom: 'nausea',
    severity: 'mild',
    occurred_at: new Date().toISOString(),
  },
});
const chk = await api('/rest/v1/daily_checkins', {
  method: 'POST',
  token: marina.token,
  body: {
    patient_id: marina.id,
    checkin_date: new Date().toISOString().slice(0, 10),
    hunger: 2,
    mood: 4,
  },
});
check(
  'peso, sintoma e check-in registrados',
  [w1, w2, sym, chk].every((r) => r.status === 201),
);

console.log('4. Vínculo por convite (Fatia 3)');
const inviteAsPatient = await api('/rest/v1/rpc/create_invite_code', {
  method: 'POST',
  token: marina.token,
  body: {},
});
check('paciente não gera código', inviteAsPatient.status >= 400);
const invite = await api('/rest/v1/rpc/create_invite_code', {
  method: 'POST',
  token: bruno.token,
  body: { p_expires_in_days: 14, p_max_uses: 1 },
});
check(
  'médico gera código de convite',
  invite.status === 200 && /^[0-9A-F]{8}$/.test(invite.data?.code ?? ''),
  JSON.stringify(invite.data),
);
const preBefore = await api('/rest/v1/dose_logs?select=id', { token: bruno.token });
check('médico sem vínculo não vê doses', preBefore.data?.length === 0);
const preview = await api('/rest/v1/rpc/preview_invite_code', {
  method: 'POST',
  token: marina.token,
  body: { p_code: ` ${invite.data.code.toLowerCase()} ` },
});
check(
  'preview mostra quem convida',
  preview.data?.[0]?.provider_name === 'Dr. Bruno Teste',
  JSON.stringify(preview.data),
);
const redeem = await api('/rest/v1/rpc/redeem_invite_code', {
  method: 'POST',
  token: marina.token,
  body: { p_code: invite.data.code.toLowerCase() },
});
check(
  'paciente resgata o convite (código "sujo")',
  redeem.status === 200,
  JSON.stringify(redeem.data),
);
const redeemAgain = await api('/rest/v1/rpc/redeem_invite_code', {
  method: 'POST',
  token: bruno.token,
  body: { p_code: invite.data.code },
});
check('código esgotado/uso por médico é rejeitado', redeemAgain.status >= 400);

console.log('5. Painel do médico (Fatia 4)');
const doses = await api(`/rest/v1/dose_logs?select=patient_id,dose_mg&patient_id=eq.${marina.id}`, {
  token: bruno.token,
});
check(
  'médico vinculado lê as doses da paciente',
  doses.data?.length === 2,
  JSON.stringify(doses.data),
);
const weights = await api(`/rest/v1/weight_logs?select=weight_kg&patient_id=eq.${marina.id}`, {
  token: bruno.token,
});
check('médico lê pesos da paciente', weights.data?.length === 2);
const audit = await api('/rest/v1/rpc/log_patient_access', {
  method: 'POST',
  token: bruno.token,
  body: {
    p_action: 'view_patient_dashboard',
    p_resource_type: 'patient_report',
    p_patient_id: marina.id,
  },
});
check(
  'acesso auditado via log_patient_access',
  audit.status === 200 || audit.status === 204,
  `status=${audit.status}`,
);
const auditRead = await api('/rest/v1/audit_logs?select=id', { token: bruno.token });
check('médico não lê o log de auditoria', auditRead.data?.length === 0);

console.log('6. Direitos LGPD (Fatia 7)');
const exported = await api('/rest/v1/rpc/export_patient_data', {
  method: 'POST',
  token: marina.token,
  body: {},
});
check(
  'exportação retorna dados do titular',
  exported.status === 200 &&
    exported.data?.dose_logs?.length === 2 &&
    exported.data?.consent_records?.length >= 3,
);
const revoke = await api(`/rest/v1/patient_provider_links?provider_id=eq.${bruno.id}`, {
  method: 'PATCH',
  token: marina.token,
  body: { status: 'revoked', revoked_at: new Date().toISOString() },
});
check(
  'paciente revoga o vínculo',
  revoke.status === 200 || revoke.status === 204,
  `status=${revoke.status}`,
);
const afterRevoke = await api(`/rest/v1/dose_logs?select=id&patient_id=eq.${marina.id}`, {
  token: bruno.token,
});
check('acesso do médico cortado após revogação', afterRevoke.data?.length === 0);
const temp = await signup(`temp.${Date.now()}@example.com`, {
  role: 'patient',
  full_name: 'Paciente Temporário',
  accepted_terms: 'true',
});
const del = await api('/rest/v1/rpc/delete_patient_account', {
  method: 'POST',
  token: temp.token,
  body: {},
});
check(
  'exclusão de conta executa',
  del.status === 200 || del.status === 204,
  `status=${del.status}`,
);
const ghost = await api('/rest/v1/profiles?select=id', { token: temp.token });
check(
  'token da conta excluída não acessa mais nada',
  ghost.status >= 400 || ghost.data?.length === 0,
  `status=${ghost.status}`,
);

console.log(`\nResultado: ${passed} PASS, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
