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
