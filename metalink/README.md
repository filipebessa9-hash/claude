# MetaLink

App de acompanhamento de pacientes em terapia com análogos de GLP-1, com ponte estruturada paciente ↔ médico. Especificação completa em [`../CLAUDE.md`](../CLAUDE.md); log de decisões em [`DECISIONS.md`](DECISIONS.md).

> **Aviso:** o MetaLink é uma ferramenta de registro e apoio. Ele não diagnostica, não prescreve e não substitui o julgamento do médico.

## Estrutura

```
metalink/
├── apps/
│   ├── mobile/     # App do paciente (Expo / React Native)
│   └── web/        # Painel do médico (Next.js)
├── packages/
│   ├── core/       # Lógica de domínio pura (tipos, labels pt-BR) + testes
│   └── db/         # Tipos das tabelas + testes de integração de RLS
├── supabase/
│   ├── migrations/ # Esquema SQL + políticas RLS
│   └── seed.sql    # Catálogo de medicamentos
└── scripts/        # test-rls.sh + stub de auth para testes
```

## Pré-requisitos

- Node 22+, pnpm 10+ (`corepack enable`)
- Docker (para os testes de RLS)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (para rodar o backend local)

## Como rodar

```bash
cd metalink
pnpm install
```

### Backend (Supabase local)

```bash
supabase init   # apenas na primeira vez, dentro de metalink/
supabase start  # sobe Postgres + Auth + API locais (Docker)
supabase db reset  # aplica supabase/migrations e seed.sql
```

`supabase start` imprime a URL da API e a anon key — use-as nos `.env` dos apps.

### Painel do médico (web)

```bash
cp apps/web/.env.example apps/web/.env.local  # preencha URL e anon key
pnpm --filter @metalink/web dev               # http://localhost:3000
```

### App do paciente (mobile)

```bash
cp apps/mobile/.env.example apps/mobile/.env  # preencha URL e anon key
pnpm --filter @metalink/mobile start          # abre o Expo (use o app Expo Go)
```

## Qualidade

```bash
pnpm lint        # ESLint
pnpm typecheck   # tsc em todos os pacotes
pnpm test        # testes unitários (Vitest)
pnpm test:rls    # testes de autorização RLS contra Postgres real (Docker)
```

Os testes de RLS provam no banco que: paciente só acessa os próprios dados; médico só lê dados de paciente com vínculo **ativo** e consentimento **vigente**; a trilha de consentimento é imutável; ninguém escala o próprio papel; acessos de médico são auditáveis.

## Teste manual da Fatia 0

1. Suba o Supabase local e o painel web (acima).
2. Crie uma conta de médico em `http://localhost:3000/cadastro` e entre — você verá o estado vazio do painel.
3. No app mobile (Expo Go), crie uma conta de paciente e entre — você verá a tela inicial do paciente.
4. Confirme no Supabase Studio (`http://127.0.0.1:54323`) que `profiles`, `patients` e `providers` foram criados com os papéis corretos.

## Teste manual da Fatia 1 (registro de dose)

1. Entre no app como paciente. A home mostra o botão **“+ Registrar dose”** e o estado vazio.
2. Toque em registrar: escolha o medicamento (chips), a dose (chips de titulação ou campo em mg com vírgula), o local de aplicação (★ marca o sugerido pela rotação) e quando foi (Hoje/Ontem/Anteontem + HH:MM). Salve.
3. De volta à home, a dose aparece no histórico (“Hoje às …”), com pull-to-refresh.
4. Registre uma segunda dose: a tela vem **pré-preenchida** com o último medicamento e dose, e o local sugerido avança no ciclo — o fluxo recorrente leva ~3 toques (< 15 s).
5. Valide os erros: dose vazia/inválida, horário no futuro e HH:MM malformado são bloqueados com mensagens em pt-BR.

## Teste manual da Fatia 2 (peso, sintomas e check-in)

1. Na home, use a linha de ações: **Peso**, **Sintomas** e **Check-in**.
2. Em Peso, registre alguns pesos (inclusive "Ontem"/"Anteontem"): o gráfico de tendência aparece a partir de 2 registros, com cards de "Último registro", "Desde o início" e (com dados de 30+ dias) "Últimos 30 dias".
3. Em Sintomas, registre um efeito colateral (tipo + intensidade + quando): ele entra na linha do tempo.
4. Em Check-in, responda o que quiser (tudo opcional) e salve; reabra no mesmo dia e confira que os valores voltam preenchidos (1 check-in por dia, atualizável).
5. Faixas inválidas são bloqueadas (peso fora de 20–400 kg, horário no futuro).

## Teste manual da Fatia 3 (vínculo paciente ↔ médico)

1. No painel web, logado como médico, clique em **“Gerar código de convite”** — o código aparece com validade de 14 dias e uso único, e entra na tabela de códigos.
2. No app, como paciente, abra **“Meu médico”**, digite o código (minúsculas/espaços/O no lugar de 0 funcionam) e toque em **Verificar código** — o app mostra quem está convidando (nome/CRM).
3. Toque em **“Autorizar e vincular”** — a tela de consentimento explica o que será compartilhado. Após confirmar, o vínculo aparece como ativo.
4. Recarregue o painel web: o paciente aparece em **“Pacientes vinculados”** e o código consta como usado (1/1). Reusar o mesmo código falha (“já foi utilizado”).
5. No app, toque em **“Revogar acesso”** e confirme: o painel web deixa de listar/exibir os dados do paciente imediatamente.

## Teste manual da Fatia 4 (painel do médico + relatório)

1. Com um paciente vinculado que tenha registros (doses, pesos, sintomas, check-ins), clique no nome dele no painel web.
2. A visão 1-clique mostra: **sinais para atenção** (se houver — ex.: registre 3 vômitos na semana ou pule 2 doses no app para vê-los), curva de peso, **aderência** (esperadas × registradas, com lacuna atual), tabela de doses, sintomas e agregado de check-ins.
3. Clique em **“Baixar relatório de consulta (PDF)”**: o PDF traz as mesmas seções + rodapé de confidencialidade.
4. Auditoria: no Supabase Studio, confira em `audit_logs` os eventos `view_patient_dashboard` e `export_consultation_report` com o médico como ator.
5. Sem vínculo/consentimento, a URL do paciente responde 404 e o PDF não é gerado (RLS).

## Teste manual da Fatia 5 (nível estimado de medicação)

1. No app, com doses registradas, abra **“Nível”** na home: a curva dos últimos 30 dias sobe a cada dose e decai pela meia-vida do princípio ativo; o valor atual aparece como % do pico do período (nunca em mg).
2. O disclaimer educativo obrigatório aparece na tela — o mesmo texto exigido pela Seção 6 do CLAUDE.md.
3. No painel web do paciente e no PDF, a seção “Nível estimado de medicação” traz o mesmo número relativo e o mesmo disclaimer.
4. Sem doses, as três superfícies mostram estado vazio (“sem estimativa”), nunca 0% enganoso.

## Teste manual da Fatia 6 (lembretes e resumo semanal)

1. No app, abra **“Lembretes”** e ative o lembrete de dose (conceda a permissão de notificações). A tela mostra o próximo lembrete, calculado da última dose + esquema (semanal/diário), no horário escolhido (8h/14h/20h).
2. Registre uma nova dose: o lembrete é reagendado automaticamente para o próximo ciclo.
3. Ative o **resumo semanal**: um aviso recorrente fica agendado para domingo às 18h.
4. Confira que as notificações exibem apenas texto genérico — sem medicamento, dose ou peso (LGPD/tela bloqueada).
5. Abra **“Resumo da semana”**: doses registradas × esperadas, último peso e variação, sintomas (com aviso gentil se houve intensos) e dias com check-in — em tom encorajador, sem cobrança.
   Nota: em builds de desenvolvimento no Expo Go, notificações locais funcionam; para produção use um development build/EAS.

## Teste manual da Fatia 7 (LGPD, hardening e acessibilidade)

1. Crie uma conta nova de paciente: o cadastro exige marcar o aceite dos **Termos** e da **Política de Privacidade** (telas reais, com placeholder legal); no Supabase Studio, `consent_records` ganha os registros `terms` e `privacy`.
2. Na home, abra **“Privacidade e dados”**: exporte seus dados (JSON completo via compartilhamento do sistema) — o evento `export_own_data` aparece em `audit_logs`.
3. **“Revogar todo o compartilhamento”**: médicos perdem acesso na hora (consentimento negativo + vínculos revogados).
4. **“Excluir minha conta e dados”** (dupla confirmação): a conta some de `auth.users` e todos os registros são eliminados em cascata; a trilha de auditoria permanece com o evento `account_deleted`.
5. No painel web, confira os security headers (`X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`) nas respostas.
