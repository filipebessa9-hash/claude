# CLAUDE.md — Especificação do Projeto: **MetaLink** (nome de trabalho)
> App de acompanhamento de pacientes em terapia com análogos de GLP-1, com ponte estruturada paciente ↔ médico.

> **Como usar este arquivo:** salve-o como `CLAUDE.md` na raiz do repositório. O Claude Code o lê automaticamente como contexto persistente em toda sessão. Trate cada seção abaixo como fonte de verdade. Quando eu pedir uma funcionalidade nova, consulte este documento antes de decidir arquitetura, escopo ou prioridade.

---

## 0. Como quero que você trabalhe (meta-instruções para o Claude Code)

- **Antes de codar qualquer coisa nova, proponha um plano curto** (arquivos que vai criar/alterar, decisões de arquitetura, riscos) e espere meu "ok". Não faça grandes refactors sem me avisar.
- **Construa em fatias verticais funcionais**, não em camadas horizontais. Cada fatia deve rodar de ponta a ponta (UI → API → banco) e ser testável antes de seguir.
- **Priorize o caminho crítico do MVP** (Seção 4). Se eu pedir algo fora dele, me avise que está fora de escopo antes de fazer, e pergunte se quero adiar.
- **Este é um software de saúde.** Trate privacidade, segurança e conformidade (Seção 7) como requisitos de primeira classe, não como "depois". Nunca escreva código que reivindique diagnóstico, prescrição ou decisão clínica automatizada — o app **apoia** o julgamento do médico, nunca o substitui.
- **Escreva testes** para lógica de negócio (cálculo de aderência, geração de relatório, alertas). Rode a suíte antes de dizer que terminou uma fatia.
- **Explique decisões não óbvias em comentários curtos** e mantenha um `DECISIONS.md` com um log de escolhas de arquitetura (1-2 linhas cada).
- **Quando houver ambiguidade de produto**, faça a suposição mais razoável, marque com `// ASSUMPTION:` e me liste as suposições ao final da fatia.
- Idioma do produto: **português do Brasil** (pt-BR). Código, nomes de variáveis e commits em inglês.
- Trabalhe de forma incremental e faça commits pequenos e descritivos (Conventional Commits).

---

## 1. Visão e tese do produto

O mercado de "trackers" de GLP-1 está **saturado** (Shotsy, Glapp, Pep, OzemPro e dezenas de outros). Construir mais um diário de injeções é uma corrida perdida.

**A tese diferencial deste app é a ponte clínica estruturada:** o paciente registra sua jornada (peso, doses, efeitos colaterais, rotina, humor/fome) e esses dados viram um **relatório acionável e um painel para o médico prescritor**, encaixado no fluxo de consulta. O fosso defensável é: (1) integração paciente↔médico bem feita, (2) profundidade clínica e localização para o Brasil, (3) dados longitudinais que melhoram aderência e desfechos.

**Modelo de distribuição primário: B2B2C** — via clínicas de saúde metabólica, endocrinologistas e plataformas de telemedicina. O paciente é o usuário; a clínica/médico é o canal e, potencialmente, quem paga. Um tier premium para paciente é secundário.

**Princípio de posicionamento:** neutralidade de marca (não somos de nenhuma farmacêutica), agnóstico quanto ao medicamento, e foco em *cuidado contínuo* — não só logging.

---

## 2. Personas e casos de uso

### Persona A — Paciente ("Marina", 38, usa semaglutida há 3 meses)
- Quer registrar dose semanal sem fricção, ver a evolução de peso e entender se os efeitos colaterais que sente são esperados.
- Esquece doses e não sabe se pode ajustar horário. Tem "food noise" e quer acompanhar.
- **Não** quer preencher formulários longos. Registro de dose deve levar < 15 segundos.

### Persona B — Médico ("Dr. Bruno", endocrinologista, 40 pacientes em GLP-1)
- Tem **pouco tempo** e fadiga de ferramentas. Só vai adotar se economizar tempo dele.
- Quer, em **1 clique**, ver o resumo de um paciente antes/durante a consulta: curva de peso, aderência, efeitos colaterais reportados, doses aplicadas, sinais de alerta.
- Quer um relatório limpo (PDF/tela) para decidir titulação e conversar com o paciente.

### Persona C — Clínica/Admin (canal B2B2C)
- Cadastra médicos, vincula pacientes, acompanha adesão agregada e engajamento.

### Casos de uso centrais (MVP)
1. Paciente registra uma dose (medicamento, dose em mg, data/hora, local de aplicação).
2. Paciente registra peso e sintomas/efeitos colaterais e check-in diário curto.
3. App calcula aderência, tendência de peso e **nível estimado de medicação** (curva PK simplificada — ver Seção 6).
4. Médico visualiza o painel do paciente e gera um **relatório de consulta**.
5. Paciente recebe lembretes de dose e um resumo semanal.
6. Vínculo paciente↔médico via código de convite da clínica/médico.

---

## 3. Escopo — o que **é** e o que **não é** o MVP

### DENTRO do MVP
- Cadastro e autenticação (paciente e médico) com papéis distintos.
- Registro de doses, peso, sintomas/efeitos colaterais, check-in diário (fome/"food noise", humor, energia, hidratação, proteína — leves, opcionais).
- Dashboards do paciente (evolução de peso, histórico de doses, timeline de sintomas).
- Nível estimado de medicação (curva PK simplificada, com disclaimer educativo).
- Painel do médico + geração de relatório de consulta (tela + export PDF).
- Vínculo paciente↔médico por código de convite.
- Lembretes de dose (push/local) e resumo semanal.
- Rotação de local de injeção (mapa visual simples).
- Conformidade LGPD desde o design (consentimento, minimização, criptografia).

### FORA do MVP (backlog explícito — não construir agora)
- Prescrição eletrônica / integração com receita.
- Telemedicina embutida (vídeo/chat clínico).
- Registro alimentar completo com base nutricional / scanner por foto.
- Integração com wearables (Apple Health/Google Fit) — *deixar ganchos, não implementar*.
- IA generativa dando conselhos clínicos ao paciente (**explicitamente proibido no MVP** por risco regulatório).
- Faturamento/pagamentos in-app.
- Multi-idioma além de pt-BR.

> Se eu pedir um item "FORA", me lembre desta seção e pergunte se quero repriorizar.

---

## 4. Ordem de construção (roadmap de fatias verticais)

Construa **nesta ordem**. Cada fatia termina com: rodando localmente + testes verdes + como testar manualmente.

1. **Fatia 0 — Fundação:** scaffolding do projeto, tooling (lint/format/test), esquema inicial do banco, autenticação básica com papéis (paciente/médico), CI mínimo.
2. **Fatia 1 — Registro de dose (paciente):** modelo de dose + tela de registro < 15s + lista/histórico. É o núcleo viciante do app.
3. **Fatia 2 — Peso e sintomas:** registro de peso + efeitos colaterais + check-in diário; gráfico de tendência de peso.
4. **Fatia 3 — Vínculo paciente↔médico:** código de convite, aceitação, papéis e permissões (médico só vê seus pacientes vinculados).
5. **Fatia 4 — Painel do médico + relatório de consulta:** visão de 1 clique por paciente + export PDF. **Esta fatia é o diferencial — capriche.**
6. **Fatia 5 — Nível estimado de medicação (PK):** curva simplificada + visualização + disclaimers.
7. **Fatia 6 — Lembretes e resumo semanal:** notificações de dose + digest.
8. **Fatia 7 — Polimento LGPD/segurança + hardening + acessibilidade.**

Pare ao fim de cada fatia e me mostre o resultado antes de seguir.

---

## 5. Stack técnica (proponha e confirme comigo antes da Fatia 0)

Tenho preferências, mas quero seu parecer. Otimize para: **velocidade de MVP, um dev, mobile-first, e migração fácil para produção segura de dados de saúde.**

- **Sugestão de partida (me confirme ou proponha melhor):**
  - App mobile: **React Native (Expo)** para iOS + Android com um só código.
  - Backend/BD: **Supabase** (Postgres + Auth + Row Level Security) — RLS ajuda muito na separação paciente/médico e na LGPD. Alternativa: Node + Postgres.
  - Painel do médico: web (**Next.js**) reaproveitando a mesma API/BD.
  - Geração de PDF do relatório: server-side.
- **Requisitos inegociáveis da stack:** dados em repouso e em trânsito criptografados; RLS/autorização por papel; hospedagem que permita residência de dados adequada; logs de auditoria de acesso a dados de paciente.
- Se você discordar de qualquer escolha por um motivo técnico forte, **diga antes de começar.**

---

## 6. Regras de domínio (clínico) — implemente com cuidado

- **Medicamentos suportados no MVP:** semaglutida (Ozempic®, Wegovy®, Rybelsus® oral), tirzepatida (Mounjaro®, Zepbound®), liraglutida (Saxenda®, Victoza®). Modele o medicamento como entidade com: nome comercial, princípio ativo, via (injetável semanal / injetável diário / oral), meia-vida, esquema de titulação típico.
- **Nível estimado de medicação:** use um modelo PK de compartimento simples baseado na meia-vida do princípio ativo (decaimento exponencial acumulado entre doses). É uma **estimativa educativa**, não um valor clínico. Toda tela que mostrar isso deve ter disclaimer: *"Estimativa educativa. Não é medição real nem recomendação de dose. Consulte seu médico."*
- **Aderência:** calcule com base em doses esperadas (pelo esquema) vs. registradas, tolerância de janela configurável.
- **Sinais de alerta para o painel do médico** (destacar, nunca agir sozinho): perda de peso rápida demais, efeitos colaterais graves reportados (ex.: vômitos persistentes, dor abdominal intensa), doses puladas em sequência, ganho de peso inesperado. São *flags para atenção do médico*, com texto neutro.
- **Nunca** gere texto que diga ao paciente para mudar dose, iniciar, parar ou ajustar medicação. O app registra e informa; a decisão é do médico.
- Rotação de local de injeção: sugerir próximo local com base no último registrado (lógica simples de ciclo), sem alarmismo.

---

## 7. Privacidade, segurança e conformidade (requisito de primeira classe)

- **LGPD by design:** colete o mínimo necessário; consentimento explícito e granular no onboarding; permita exportação e exclusão de dados do titular (direito de acesso/eliminação).
- Dados de saúde são **dados sensíveis** sob a LGPD — trate com rigor: criptografia em repouso e em trânsito, controle de acesso por papel (RLS), e **log de auditoria** de todo acesso do médico/admin a dados de paciente.
- Separação estrita: um médico só acessa pacientes **explicitamente vinculados** e que **consentiram** o compartilhamento. Implemente isso na camada de autorização do banco (RLS), não só na UI.
- **Enquadramento regulatório (ANVISA/CFM):** o app é ferramenta de registro e apoio, **não um dispositivo médico que diagnostica/trata**. Evite qualquer feature que empurre o produto para a categoria de SaMD de maior risco. Coloque disclaimers claros. Se alguma feature que eu pedir arriscar mudar esse enquadramento, **me avise explicitamente.**
- Não logue dados sensíveis de paciente em logs de aplicação/observabilidade.
- Textos legais (termos, política de privacidade, consentimento) devem existir como telas reais, com placeholder claro `// LEGAL: revisar com advogado` — não invente cláusulas jurídicas definitivas.

---

## 8. Princípios de UX

- **Fricção mínima no registro** (a métrica de sucesso do paciente é registrar em segundos).
- Mobile-first, acessível (contraste, tamanho de toque, suporte a leitor de tela, fontes escaláveis).
- Tom encorajador e **não-julgador** sobre peso e corpo; evitar linguagem que reforce vergonha ou comportamento alimentar disfuncional. Sem "metas agressivas" nem gamificação de restrição.
- O médico vê **densidade de informação**; o paciente vê **clareza e simplicidade**. São duas UIs com filosofias diferentes.
- Estados vazios úteis (primeiro uso deve ensinar, não intimidar).

---

## 9. Definição de "pronto" (para cada fatia)

- [ ] Roda localmente sem erros; instruções de como rodar no README.
- [ ] Testes de lógica de negócio passando.
- [ ] Autorização por papel respeitada e testada (paciente não acessa dado de outro; médico só vê vinculados).
- [ ] Sem dados sensíveis em logs.
- [ ] Strings de UI em pt-BR; disclaimers clínicos presentes onde exigido (Seção 6).
- [ ] Suposições (`// ASSUMPTION:`) listadas para mim.
- [ ] Commit(s) pequenos e descritivos.

---

## 10. Primeira tarefa

Comece pela **Fatia 0 (Fundação)**. Antes de escrever código:
1. Proponha a stack final (confirmando ou ajustando a Seção 5), com uma justificativa curta por escolha.
2. Proponha o **esquema inicial do banco** (entidades: User/paciente/médico/clínica, Medication, DoseLog, WeightLog, SymptomLog, DailyCheckin, PatientProviderLink, ConsentRecord, AuditLog) — só o desenho, para eu aprovar.
3. Liste a estrutura de pastas do repositório.
4. Espere meu "ok" e então implemente a Fatia 0.

Quando estiver pronto, me apresente o plano. Não avance para a Fatia 1 sem aprovação.
