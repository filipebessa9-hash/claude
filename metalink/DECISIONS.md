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
- 2026-07-07 — (Fatia 1) Registro de dose grava `taken_at = dia (Hoje/Ontem/Anteontem) + HH:MM` em vez de datetime picker nativo: zero dependência extra, cobre o caso real ("esqueci de registrar ontem") e mantém o fluxo recorrente em ~3 toques. Datas mais antigas ficam para edição de histórico (fatia futura).
- 2026-07-07 — (Fatia 1) Pré-preenchimento vem do último `dose_log` (medicamento, dose, próximo local do ciclo), não de `patient_medications`; o esquema ativo do paciente entra na fatia de aderência, onde é de fato necessário.
- 2026-07-07 — (Fatia 1) Mobile acessa o Supabase direto do cliente (padrão Supabase), confiando no RLS testado por integração; sem camada de API própria por ora.
- 2026-07-07 — (Fatia 2) Gráfico de tendência de peso desenhado com react-native-svg + função pura em @metalink/core (buildWeightChartPoints), em vez de lib de gráficos: zero config, testável por unidade, e a mesma função servirá ao painel web.
- 2026-07-07 — (Fatia 2) Check-in diário é upsert por (patient_id, checkin_date) no fuso local do aparelho; tocar de novo no mesmo valor desmarca (tudo opcional, sem obrigação de completar).
- 2026-07-07 — (Fatia 3) Fluxo de convite roda inteiro em funções security definer (create/preview/redeem): atômico, não expõe invite_codes ao paciente, e o resgate grava vínculo + consentimento + auditoria na mesma transação.
- 2026-07-07 — (Fatia 3) Código de convite: 8 hex de gen_random_uuid() (32 bits) — suficiente porque expira, tem max_uses e o resgate ainda exige consentimento; normalização espelhada (SQL + core) corrige O→0 e I/L→1.
- 2026-07-07 — (Fatia 3) Consentimento provider_sharing é global do paciente (registrado no resgate); revogar um médico específico = revogar o vínculo (status revoked). Revogação total de compartilhamento (consent false) ficará na tela LGPD da Fatia 7.
- 2026-07-07 — (Fatia 3) Preview antes do resgate: o paciente vê nome/CRM de quem convida antes de consentir (decisão informada, LGPD).
- 2026-07-07 — (Fatia 4) Aderência inferida dos próprios registros (âncora = primeira dose do período; intervalo pela via do medicamento; tolerância semanal ±1d, diária ±12h) — sem prescrição estruturada no MVP. Sem doses no período → "sem dados", nunca 0%.
- 2026-07-07 — (Fatia 4) Thresholds das flags (ASSUMPTION, a calibrar): perda ≥4%/30d, ganho ≥3%/30d, sintoma intenso no período, vômitos ≥3/7d, ≥2 doses esperadas sem registro. Texto neutro; painel e PDF dizem explicitamente que não é diagnóstico.
- 2026-07-07 — (Fatia 4) Todo acesso do médico (painel e export PDF) chama log_patient_access() server-side; falha de auditoria não derruba a página nem loga dados do paciente.
- 2026-07-07 — (Fatia 4) PDF com @react-pdf/renderer em route handler Node (renderToBuffer): determinístico e sem Chromium headless no servidor.
- 2026-07-07 — (Fatia 5) Nível estimado exibido como % do pico dos últimos 30 dias, nunca em mg: evita falsa precisão clínica num modelo educativo de compartimento único (soma de decaimentos 2^(-Δt/meia-vida)).
- 2026-07-07 — (Fatia 5) Curva calculada só para o medicamento da dose mais recente (ASSUMPTION); troca de princípio ativo zera a curva anterior — comportamento aceitável para o MVP.
- 2026-07-07 — (Fatia 5) Gráficos de série temporal unificados em buildSeriesChartPoints (core/chart.ts); peso e PK delegam ao mesmo helper.
