/**
 * Testes de integração das políticas RLS (Seção 7 do CLAUDE.md).
 *
 * Rodam contra um Postgres real com o stub de auth do Supabase aplicado.
 * Use `pnpm test:rls` na raiz (sobe o banco em Docker e injeta DATABASE_URL).
 * Sem DATABASE_URL, a suíte é pulada — assim `pnpm test` funciona sem Docker.
 */
import { randomUUID } from 'node:crypto';

import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const databaseUrl = process.env.DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;

suite('Row Level Security', () => {
  const pool = new pg.Pool({ connectionString: databaseUrl });

  const patientA = randomUUID();
  const patientB = randomUUID();
  const provider = randomUUID();
  let ozempicId: string;

  /** Executa `fn` numa transação como o usuário autenticado `uid`. */
  async function asUser<T>(uid: string, fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ sub: uid, role: 'authenticated' }),
      ]);
      await client.query('set local role authenticated');
      const result = await fn(client);
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  beforeAll(async () => {
    // Signup simulado: inserir em auth.users dispara handle_new_user().
    await pool.query(
      `insert into auth.users (id, email, raw_user_meta_data) values
         ($1, 'paciente.a@example.com', '{"role":"patient","full_name":"Paciente A"}'),
         ($2, 'paciente.b@example.com', '{"role":"patient","full_name":"Paciente B"}'),
         ($3, 'medico@example.com', '{"role":"provider","full_name":"Dr. Bruno","crm":"CRM-SP 123456"}')`,
      [patientA, patientB, provider],
    );
    const med = await pool.query("select id from medications where brand_name = 'Ozempic'");
    ozempicId = med.rows[0].id;
    await pool.query(
      `insert into dose_logs (patient_id, medication_id, dose_mg, taken_at) values
         ($1, $3, 0.25, now()), ($2, $3, 0.5, now())`,
      [patientA, patientB, ozempicId],
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it('trigger de signup cria perfil e linha de paciente/médico com o papel certo', async () => {
    const profiles = await pool.query('select id, role from profiles order by created_at');
    const roles = Object.fromEntries(profiles.rows.map((r) => [r.id, r.role]));
    expect(roles[patientA]).toBe('patient');
    expect(roles[provider]).toBe('provider');
    const prov = await pool.query('select crm from providers where profile_id = $1', [provider]);
    expect(prov.rows[0].crm).toBe('CRM-SP 123456');
  });

  it('paciente vê apenas os próprios registros de dose', async () => {
    const rows = await asUser(patientA, async (c) => {
      const r = await c.query('select patient_id from dose_logs');
      return r.rows;
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].patient_id).toBe(patientA);
  });

  it('paciente não consegue inserir registro de dose para outro paciente', async () => {
    await expect(
      asUser(patientA, (c) =>
        c.query(
          'insert into dose_logs (patient_id, medication_id, dose_mg, taken_at) values ($1, $2, 1.0, now())',
          [patientB, ozempicId],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('médico sem vínculo não vê nenhum dado de paciente', async () => {
    const rows = await asUser(
      provider,
      async (c) => (await c.query('select * from dose_logs')).rows,
    );
    expect(rows).toHaveLength(0);
  });

  it('vínculo ativo SEM consentimento ainda não dá acesso ao médico', async () => {
    await pool.query(
      `insert into patient_provider_links (patient_id, provider_id, status) values ($1, $2, 'active')`,
      [patientA, provider],
    );
    const rows = await asUser(
      provider,
      async (c) => (await c.query('select * from dose_logs')).rows,
    );
    expect(rows).toHaveLength(0);
  });

  it('com vínculo ativo + consentimento, médico vê o paciente vinculado (e só ele)', async () => {
    // O próprio paciente registra o consentimento de compartilhamento.
    await asUser(patientA, (c) =>
      c.query(
        `insert into consent_records (patient_id, consent_type, granted) values ($1, 'provider_sharing', true)`,
        [patientA],
      ),
    );
    const rows = await asUser(
      provider,
      async (c) => (await c.query('select patient_id from dose_logs')).rows,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].patient_id).toBe(patientA);

    const profile = await asUser(
      provider,
      async (c) => (await c.query('select full_name from profiles where id = $1', [patientA])).rows,
    );
    expect(profile).toHaveLength(1);
  });

  it('médico vinculado não consegue escrever nos dados do paciente', async () => {
    await expect(
      asUser(provider, (c) =>
        c.query(
          'insert into dose_logs (patient_id, medication_id, dose_mg, taken_at) values ($1, $2, 1.0, now())',
          [patientA, ozempicId],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('consentimento revogado corta o acesso do médico imediatamente', async () => {
    await asUser(patientA, (c) =>
      c.query(
        `insert into consent_records (patient_id, consent_type, granted) values ($1, 'provider_sharing', false)`,
        [patientA],
      ),
    );
    const rows = await asUser(
      provider,
      async (c) => (await c.query('select * from dose_logs')).rows,
    );
    expect(rows).toHaveLength(0);
    // Restaura o consentimento para os testes seguintes.
    await asUser(patientA, (c) =>
      c.query(
        `insert into consent_records (patient_id, consent_type, granted) values ($1, 'provider_sharing', true)`,
        [patientA],
      ),
    );
  });

  it('trilha de consentimento é imutável para o titular (sem UPDATE/DELETE)', async () => {
    const updated = await asUser(patientA, (c) =>
      c.query('update consent_records set granted = false where patient_id = $1', [patientA]),
    );
    expect(updated.rowCount).toBe(0);
    const deleted = await asUser(patientA, (c) =>
      c.query('delete from consent_records where patient_id = $1', [patientA]),
    );
    expect(deleted.rowCount).toBe(0);
  });

  it('usuário não consegue escalar o próprio papel', async () => {
    await expect(
      asUser(patientA, (c) =>
        c.query(`update profiles set role = 'provider' where id = $1`, [patientA]),
      ),
    ).rejects.toThrow(/role change is not allowed/);
  });

  it('acesso do médico é auditável via log_patient_access, e o log não é legível por ele', async () => {
    await asUser(provider, (c) =>
      c.query(`select log_patient_access('view_dashboard', 'dose_logs', $1)`, [patientA]),
    );
    const audit = await pool.query('select actor_id, patient_id from audit_logs');
    expect(audit.rows).toContainEqual({ actor_id: provider, patient_id: patientA });

    const asProvider = await asUser(
      provider,
      async (c) => (await c.query('select * from audit_logs')).rows,
    );
    expect(asProvider).toHaveLength(0);
  });

  it('catálogo de medicamentos é legível por qualquer usuário autenticado', async () => {
    const rows = await asUser(
      patientB,
      async (c) => (await c.query('select brand_name from medications')).rows,
    );
    expect(rows.length).toBeGreaterThanOrEqual(7);
  });

  it('peso e check-in: dono escreve e lê; outro paciente não vê; médico vinculado só lê', async () => {
    // Paciente A registra peso e faz upsert do check-in de hoje (fluxo da Fatia 2).
    await asUser(patientA, (c) =>
      c.query(
        'insert into weight_logs (patient_id, weight_kg, measured_at) values ($1, 90.5, now())',
        [patientA],
      ),
    );
    await asUser(patientA, (c) =>
      c.query(
        `insert into daily_checkins (patient_id, checkin_date, hunger) values ($1, current_date, 4)
           on conflict (patient_id, checkin_date) do update set hunger = 4`,
        [patientA],
      ),
    );

    const asOtherPatient = await asUser(
      patientB,
      async (c) => (await c.query('select * from weight_logs')).rows,
    );
    expect(asOtherPatient).toHaveLength(0);

    // Médico com vínculo ativo + consentimento (restaurado acima) lê os dois.
    const weights = await asUser(
      provider,
      async (c) => (await c.query('select patient_id from weight_logs')).rows,
    );
    expect(weights).toHaveLength(1);
    expect(weights[0].patient_id).toBe(patientA);
    const checkins = await asUser(
      provider,
      async (c) => (await c.query('select hunger from daily_checkins')).rows,
    );
    expect(checkins).toHaveLength(1);
    expect(checkins[0].hunger).toBe(4);

    // ...mas não escreve.
    await expect(
      asUser(provider, (c) =>
        c.query(
          'insert into weight_logs (patient_id, weight_kg, measured_at) values ($1, 80, now())',
          [patientA],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('fluxo de convite: criar → prever → resgatar → acesso → esgotar → revogar', async () => {
    // Médica nova, sem nenhum vínculo, para isolar o fluxo.
    const providerB = randomUUID();
    await pool.query(
      `insert into auth.users (id, email, raw_user_meta_data) values
         ($1, 'dra.carla@example.com', '{"role":"provider","full_name":"Dra. Carla","crm":"CRM-RJ 654321"}')`,
      [providerB],
    );

    // Paciente não pode criar código; médico não pode resgatar.
    await expect(
      asUser(patientB, (c) => c.query('select * from create_invite_code()')),
    ).rejects.toThrow(/only_providers_can_create_invites/);

    const code: string = await asUser(
      providerB,
      async (c) => (await c.query('select code from create_invite_code(14, 1)')).rows[0].code,
    );
    expect(code).toMatch(/^[0-9A-F]{8}$/);

    await expect(
      asUser(providerB, (c) => c.query('select * from redeem_invite_code($1)', [code])),
    ).rejects.toThrow(/only_patients_can_redeem/);

    // Preview mostra quem convida, sem consumir o código.
    const preview = await asUser(
      patientB,
      async (c) => (await c.query('select * from preview_invite_code($1)', [code])).rows[0],
    );
    expect(preview.provider_name).toBe('Dra. Carla');
    expect(preview.provider_crm).toBe('CRM-RJ 654321');

    // Código inexistente é rejeitado.
    await expect(
      asUser(patientB, (c) => c.query(`select * from redeem_invite_code('FFFFFFFF')`)),
    ).rejects.toThrow(/invite_not_found/);

    // Resgate aceita código "sujo" (minúsculas, espaços) graças à normalização.
    await asUser(patientB, (c) =>
      c.query('select * from redeem_invite_code($1)', [` ${code.toLowerCase()} `]),
    );

    // Médica agora vê os dados de patientB — e só dele.
    const doses = await asUser(
      providerB,
      async (c) => (await c.query('select patient_id from dose_logs')).rows,
    );
    expect(doses.map((r) => r.patient_id)).toEqual([patientB]);

    // Consentimento e auditoria registrados pelo resgate.
    const consent = await pool.query(
      `select granted from consent_records
        where patient_id = $1 and consent_type = 'provider_sharing'
        order by created_at desc limit 1`,
      [patientB],
    );
    expect(consent.rows[0].granted).toBe(true);
    const audit = await pool.query(
      `select 1 from audit_logs where actor_id = $1 and action = 'redeem_invite'`,
      [patientB],
    );
    expect(audit.rows).toHaveLength(1);

    // max_uses = 1: segundo resgate falha.
    await expect(
      asUser(patientA, (c) => c.query('select * from redeem_invite_code($1)', [code])),
    ).rejects.toThrow(/invite_exhausted/);

    // Código expirado é rejeitado no preview e no resgate.
    const expired: string = await asUser(
      providerB,
      async (c) => (await c.query('select code from create_invite_code(1, 5)')).rows[0].code,
    );
    await pool.query(
      `update invite_codes set expires_at = now() - interval '1 hour' where code = $1`,
      [expired],
    );
    await expect(
      asUser(patientA, (c) => c.query('select * from preview_invite_code($1)', [expired])),
    ).rejects.toThrow(/invite_expired/);

    // Revogação pelo paciente corta o acesso imediatamente.
    await asUser(patientB, (c) =>
      c.query(
        `update patient_provider_links set status = 'revoked', revoked_at = now()
          where provider_id = $1`,
        [providerB],
      ),
    );
    const afterRevoke = await asUser(
      providerB,
      async (c) => (await c.query('select * from dose_logs')).rows,
    );
    expect(afterRevoke).toHaveLength(0);
  });
});
