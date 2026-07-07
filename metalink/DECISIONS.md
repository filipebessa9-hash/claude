# DECISIONS — log de decisões de arquitetura

Formato: data — decisão (1-2 linhas).

- 2026-07-07 — Monorepo pnpm workspaces sem Turborepo por ora: com 2 apps + 2 pacotes, `pnpm -r` basta; Turborepo entra se o build ficar lento.
- 2026-07-07 — `node-linker=hoisted` no `.npmrc`: React Native/Metro lida melhor com node_modules achatado em monorepos pnpm.
- 2026-07-07 — Autorização vive no Postgres (RLS), testada por integração contra um Postgres real em Docker (`scripts/test-rls.sh`), com stub mínimo do schema `auth` do Supabase. Testes não dependem do Supabase CLI.
- 2026-07-07 — Acesso do médico exige vínculo `active` **e** último `consent_record` de `provider_sharing` com `granted=true` (função `provider_has_access`, security definer). Revogação de consentimento corta o acesso imediatamente.
- 2026-07-07 — `consent_records` é trilha imutável (só INSERT): revogar = inserir registro com `granted=false`. Atende LGPD (prova de consentimento ao longo do tempo).
- 2026-07-07 — Auditoria de acesso: Postgres não permite trigger em SELECT, então a camada de aplicação (painel/relatório) deve chamar `log_patient_access()` em todo acesso de médico a dados de paciente. Será obrigatório nas Fatias 4+.
- 2026-07-07 — Papel do usuário vem de `raw_user_meta_data.role` no signup (trigger `handle_new_user`); `clinic_admin` nunca é auto-atribuível e mudança de papel é bloqueada por trigger. Verificação real de CRM do médico fica para fatia futura (convite/vínculo mitiga o risco no MVP).
- 2026-07-07 — Adicionada tabela `patient_medications` (não estava na lista original): o cálculo de aderência precisa do esquema ativo do paciente (doses esperadas vs. registradas).
- 2026-07-07 — Minimização LGPD no cadastro do paciente: `birth_year` (não data de nascimento completa) e `height_cm`, ambos opcionais.
- 2026-07-07 — Tipos de banco em `@metalink/db` escritos à mão na Fatia 0 (apps só usam auth); serão substituídos por `supabase gen types` na Fatia 1.
- 2026-07-07 — Pacientes se cadastram no app móvel; médicos, no painel web (simplifica cada UI para sua persona).
