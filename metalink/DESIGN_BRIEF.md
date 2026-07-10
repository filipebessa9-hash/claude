# MetaLink — Brief de Interface (para gerar a UI no Claude)

> Cole este arquivo inteiro no Claude e peça: **"Gere mockups de alta fidelidade destas telas como um artifact (HTML+CSS), mobile-first, em pt-BR, seguindo o sistema visual abaixo."** Cada tela está descrita com layout, componentes e os textos reais do app. Gere uma tela por vez ou uma galeria com todas.

MetaLink é um app de acompanhamento de pacientes em terapia com análogos de GLP-1 (semaglutida, tirzepatida, liraglutida), com uma ponte clínica estruturada paciente ↔ médico. São **dois produtos com filosofias visuais diferentes**:

- **App do paciente (mobile, iOS/Android):** clareza e simplicidade. Registro em segundos, tom encorajador e não-julgador sobre peso e corpo. Fundo claro, cartões, chips grandes de toque.
- **Painel do médico (web):** densidade de informação. Visão de 1 clique por paciente, tabelas, gráficos, sinais de alerta.

---

## 1. Sistema visual (tokens)

**Cores**
| Token | Hex | Uso |
|---|---|---|
| Accent (verde) | `#0f6e5c` | Botões primários, chips selecionados, valores de destaque, links |
| Accent suave | `#eef6f4` | Fundo de cartões de consentimento/destaque |
| Texto | `#1a1a2e` | Texto principal |
| Texto suave (muted) | `#6b7280` | Legendas, dicas, metadados |
| Fundo app | `#fafafa` | Fundo de tela (web) |
| Superfície | `#ffffff` | Cartões |
| Borda | `#e5e7eb` / `#d1d5db` | Bordas de cartões e inputs |
| Erro | `#b91c1c` | Mensagens de erro, ações destrutivas, fundo de alerta `#fdf2f2` |

**Tipografia:** system-ui / -apple-system / Segoe UI / Roboto. Títulos de tela 20–22px/600; seções 15–16px/600; corpo 14–16px; legendas 12–13px em muted. Line-height confortável (~1.5).

**Formas & espaçamento:** cantos arredondados (cartões 10px, inputs/botões 8px, chips 20px pill). Padding de tela 20px. Gap entre elementos 8–12px. **Alvos de toque ≥ 44–48px** (acessibilidade). Botão primário: fundo accent, texto branco, altura ~52px.

**Componentes base**
- **Chip** (seleção): pílula com borda `#d1d5db`; quando selecionado, fundo `#0f6e5c` + texto branco 600. Usado para medicamento, dose, local, dia, intensidade, escalas.
- **Cartão**: superfície branca, borda `#e5e7eb`, radius 10, padding 14.
- **Botão primário**: accent, texto branco, radius 8. **Botão secundário/ação**: contorno accent, texto accent.
- **Estado vazio**: título 17px/600 + parágrafo muted centralizado, tom que ensina sem intimidar.

**Tom de voz (pt-BR):** encorajador, sem cobrança, sem metas agressivas nem gamificação de restrição. Nunca linguagem que reforce vergonha corporal.

---

## 2. App do paciente (mobile) — telas

Viewport de referência: **390 × 844** (iPhone). Header simples com título centralizado.

### 2.1 Entrar (`/entrar`)
- Título: **"Bem-vindo(a) de volta"**
- Campos: **E-mail**, **Senha** (inputs com borda, radius 8).
- Botão primário **"Entrar"**.
- Link centralizado accent: **"Ainda não tem conta? Criar conta"**.

### 2.2 Criar conta (`/criar-conta`)
- Título **"Criar conta"** + subtítulo muted: *"Acompanhe sua jornada e compartilhe com seu médico apenas o que você autorizar."*
- Campos: **Nome**, **E-mail**, **Senha (mín. 8 caracteres)**.
- **Checkbox de consentimento** (obrigatório): ☐ *"Li e aceito os **Termos de Uso** e a **Política de Privacidade**."* (links sublinhados accent).
- Botão primário **"Criar conta"**; link **"Já tem conta? Entrar"**.

### 2.3 Home / Hub (`/home`) — TELA PRINCIPAL
Ordem vertical:
1. Saudação: **"Olá, Marina!"** (22px/600).
2. **Botão grande primário** (altura 56): **"+ Registrar dose"**.
3. **Linha de ações** (3 botões contorno accent, lado a lado): **Peso** · **Sintomas** · **Check-in**.
4. Segunda linha de ações: **Resumo da semana** · **Lembretes**.
5. Botão largura total contorno: **"Meu médico"**.
6. Seção **"Suas aplicações"** — lista de cartões de dose:
   - Cartão: linha superior com **nome do medicamento** (16/600) à esquerda e **dose** em accent à direita (ex.: "0,5 mg"); abaixo, metadado muted: **"Hoje às 09:15 · Abdômen (lado direito)"**; observação opcional.
7. Rodapé com links muted: **"Privacidade e dados"** e **"Sair da conta"**.
- **Estado vazio** (sem doses): título **"Comece pela sua primeira dose"** + texto *"Toque em 'Registrar dose' e anote sua aplicação em poucos segundos. Seu histórico aparecerá aqui, no seu ritmo — sem cobranças."*

### 2.4 Registrar dose (`/registrar-dose`) — FLUXO CRÍTICO (< 15s)
Rolagem vertical. Para usuário recorrente, mostra no topo a dica muted: *"Pré-preenchido com sua última aplicação — confira e salve."*
- Seção **"Medicamento"**: linha de chips (Ozempic, Wegovy, Rybelsus, Mounjaro, Zepbound, Saxenda, Victoza) — um selecionado.
- Seção **"Dose (mg)"**: chips de doses da titulação do medicamento (ex.: 0,25 mg / 0,5 mg / 1,0 mg / 2,0 mg) + input decimal ("Ex.: 0,5", vírgula pt-BR).
- Seção **"Local da aplicação"**: chips (Abdômen esquerdo/direito, Coxa esquerda/direita, Braço esquerdo/direito). O local **sugerido pela rotação** recebe uma **★**. Dica muted: *"★ = próximo local sugerido pela rotação de aplicação."*
- Seção **"Quando"**: chips **Hoje / Ontem / Anteontem** + input de hora **"HH:MM"** (largura ~90px) ao lado.
- Seção **"Observações (opcional)"**: input ("Algo que queira lembrar ou contar ao seu médico").
- **Botão primário grande** (altura 52): **"Salvar dose"**.

### 2.5 Peso (`/peso`)
- Botão primário **"+ Registrar peso"**.
- **3 cartões-resumo** lado a lado (valor accent 16/600 + legenda muted): **Último registro** (ex.: "89,6 kg"), **Desde o início** (ex.: "−2,8 kg"), **Últimos 30 dias** (ex.: "−1,5 kg").
- **Gráfico de tendência** (cartão branco): linha (polyline) verde `#0f6e5c` com pontos, registros mais recentes à direita, y invertido (peso maior mais alto). Legenda muted: *"Tendência de peso — registros mais recentes à direita"*.
- Seção **"Histórico"**: linhas com peso (esquerda) e data relativa (direita, "Hoje"/"Ontem"/"01/07/2026").
- Vazio: **"Nenhum peso registrado ainda"** + texto sem metas nem cobranças.
- Sub-tela **Registrar peso**: input "Peso (kg)" ("Ex.: 82,5") + chips Hoje/Ontem/Anteontem + HH:MM + **"Salvar peso"**.

### 2.6 Sintomas (`/sintomas`)
- Botão **"+ Registrar sintoma"**; seção **"Linha do tempo"** com cartões: nome do sintoma (16/600) + intensidade em accent 600 à direita; metadado "Hoje às 14:00"; observação opcional.
- Vazio: **"Nenhum sintoma registrado"** + *"Se sentir algum efeito colateral, registre aqui… Em caso de sintomas intensos, procure atendimento médico."*
- Sub-tela **Registrar sintoma**: dica de topo *"Registrar como você se sente ajuda seu médico… Isto não é uma avaliação médica."*; chips **"O que você sentiu?"** (Náusea, Vômito, Constipação, Diarreia, Dor abdominal, Refluxo / azia, Cansaço, Dor de cabeça, Outro); chips **"Intensidade"** (Leve, Moderado, Intenso); **"Quando"** (Hoje/Ontem/Anteontem + HH:MM); Observações; **"Salvar sintoma"**.

### 2.7 Check-in do dia (`/check-in`)
Dica de topo: *"Como foi seu dia? Responda só o que quiser — tudo aqui é opcional e você pode ajustar ao longo do dia."*
Blocos com escala de chips **1–2–3–4–5** e rótulos de extremo à esquerda/direita:
- **Fome** (Pouca → Muita), **"Food noise" (pensamentos sobre comida)** (Quase nenhum → O tempo todo), **Humor** (Difícil → Ótimo), **Energia** (Baixa → Alta).
- **Bebeu água o suficiente?** e **Comeu proteína o suficiente?** → chips **Sim / Não**.
- Botão **"Salvar check-in"**. (Tocar de novo no valor desmarca; 1 por dia.)

### 2.8 Nível estimado (`/nivel`)
- Título com o medicamento (ex.: **"Ozempic"**) + subtítulo: *"Nível estimado agora: ≈78% do seu pico dos últimos 30 dias."*
- **Gráfico** (cartão): curva que **sobe a cada dose e decai pela meia-vida**, com marcador no ponto atual. Legenda: *"Últimos 30 dias — sobe a cada dose, decai pela meia-vida."*
- **Cartão de disclaimer** (fundo `#f9fafb`, borda) com o texto OBRIGATÓRIO: **"Estimativa educativa. Não é medição real nem recomendação de dose. Consulte seu médico."**
- Vazio: **"Ainda sem estimativa"** + texto.

### 2.9 Meu médico (`/medico`)
- Se houver vínculo — seção **"Acompanhando você"**: cartão com nome do médico (16/600), CRM (muted), *"Compartilhando: doses, peso, sintomas e check-ins."* e **botão contorno vermelho "Revogar acesso"**.
- Seção **"Vincular meu médico"**: dica *"Digite o código de convite que seu médico enviou. Nada é compartilhado sem a sua confirmação."*; input grande com espaçamento de letras ("Ex.: A1B2C3D4"); botão **"Verificar código"**.
- **Cartão de consentimento** (fundo `#eef6f4`, borda accent) após verificar: nome/CRM do médico + texto *"Ao confirmar, você autoriza este(a) médico(a) a visualizar seus registros no MetaLink: doses aplicadas, peso, sintomas e check-ins diários. Você pode revogar esta autorização a qualquer momento nesta tela."* + botão primário **"Autorizar e vincular"** + botão texto **"Agora não"**.

### 2.10 Lembretes (`/lembretes`)
- Linha com **Switch**: **"Lembrete de dose"** + dica *"Calculado a partir da sua última aplicação e do esquema do medicamento."* Quando ativo: **"Horário do lembrete"** com chips **Manhã (8h) / Tarde (14h) / Noite (20h)** e a linha accent *"Próximo lembrete: Amanhã às 08:00."*
- Linha com **Switch**: **"Resumo semanal"** + dica *"Um aviso aos domingos à noite com o seu resumo da semana."*
- Nota de privacidade muted no rodapé: *"As notificações não mostram medicamento, dose nem qualquer dado de saúde — apenas um lembrete para abrir o app."*

### 2.11 Resumo da semana (`/resumo`)
Título **"Sua semana"** + cartões (valor accent 20/600 + legenda):
- **"3 de 4"** — doses registradas (esperadas pelo esquema).
- **"89,6 kg (−0,7 kg)"** — último peso da semana e variação.
- **"2"** — sintomas relatados (se houver intensos: *"— 1 intenso(s); vale conversar com seu médico"*).
- **"5/7"** — dias com check-in.
- Texto encorajador: *"Cada registro conta — no seu ritmo. Esses dados ajudam você e seu médico a enxergar o caminho, sem cobrança."* + botão **"Registrar uma dose"**.

### 2.12 Privacidade e dados (`/dados`)
Intro: *"Seus dados são seus. Aqui você exerce seus direitos previstos na LGPD, direto do app e sem burocracia."*
Botões contorno accent (cada um com dica muted abaixo):
- **"Exportar meus dados (JSON)"** — *"Uma cópia completa de tudo o que você registrou…"*
- **"Revogar todo o compartilhamento"** — *"Corta imediatamente o acesso de todos os médicos…"*
- **Botão contorno vermelho "Excluir minha conta e dados"** — *"Eliminação permanente… (direito de eliminação)."*
- Links: **Termos de Uso**, **Política de Privacidade**.

---

## 3. Painel do médico (web) — telas

Layout centralizado (largura máx ~640px), fundo `#fafafa`. **Densidade de informação**, tabelas e gráficos.

### 3.1 Login (`/login`) e Cadastro (`/cadastro`)
- Login: título **"MetaLink — Painel do médico"**, E-mail/Senha, **"Entrar"**, link "Cadastre-se como médico(a)".
- Cadastro: **Nome completo**, **CRM (com UF)** ("CRM-SP 123456"), E-mail, Senha, checkbox de aceite de Termos/Privacidade, **"Criar conta"**.

### 3.2 Dashboard (`/dashboard`)
- Cabeçalho: **"MetaLink — Painel do médico"** + "Olá, **Dra. Carla Mendes**".
- Seção **"Convidar paciente"**: texto explicativo + botão **"Gerar código de convite"**; ao gerar, cartão accent-suave: **"Código: A1B2C3D4 — envie ao paciente; válido por 14 dias, uso único."** + tabela dos últimos códigos (colunas **Código / Usos / Expira em**).
- Seção **"Pacientes vinculados"**: lista com **nome do paciente como link** + "— vinculado em 07/07/2026". Vazio: mensagem de estado vazio.

### 3.3 Painel do paciente — visão 1 clique (`/dashboard/paciente/[id]`)
Link de volta "← Voltar ao painel". Título com nome do paciente + linha muted "38 anos (aprox.) · 165 cm". Link **"Baixar relatório de consulta (PDF)"**. Seções (cada uma com `<h2>`):
- **"Sinais para sua atenção"** — lista de cartões com **borda-esquerda vermelha** (fundo `#fdf2f2`): **título em negrito** + detalhe. Ex.: *"Perda de peso acelerada — Redução de 4 kg nos últimos 30 dias (≈4,4% do peso atual)."* Aviso: *"Destaques automáticos… não são diagnóstico."*
- **"Peso"** — linha "Último: **89,6 kg** · Desde o início: **−2,8 kg** · 30 dias: **−1,5 kg**" + **gráfico SVG** (polyline accent em cartão branco com borda).
- **"Nível estimado de medicação (últimos 30 dias)"** — "Ozempic — agora em ≈78% do pico do período." + gráfico + **disclaimer**: *"Estimativa educativa. Não é medição real nem recomendação de dose. Consulte seu médico."*
- **"Aderência (últimos 90 dias)"** — "**100%** — 4 de 4 doses esperadas registradas · Última dose em 07/07/2026" + nota muted sobre estimativa.
- **"Doses registradas"** — tabela (Quando / Medicamento / Dose / Local).
- **"Sintomas relatados"** — tabela (Quando / Sintoma / Intensidade / Observações).
- **"Check-ins (últimos 14 dias)"** — linha: "5 dia(s) respondido(s) · Fome 2/5 · Food noise 2/5 · Humor 4/5 · Energia 3/5 · Hidratação ok 80%".
- Rodapé muted: *"Dados registrados pelo próprio paciente no MetaLink. Este painel apoia — e não substitui — sua avaliação clínica."*

### 3.4 PDF do relatório de consulta
Documento A4, mesmas seções da 3.3 em layout limpo de impressão, cabeçalho "Relatório de consulta — MetaLink", rodapé fixo: *"Relatório gerado pelo MetaLink a partir de registros feitos pelo próprio paciente. Apoia — e não substitui — a avaliação clínica do médico. Documento confidencial: contém dados sensíveis de saúde (LGPD)."*

---

## 4. Instruções de geração sugeridas

- **Mobile**: enquadre cada tela num "device frame" 390×844, fundo branco, header com título. Priorize **Home (2.3)** e **Registrar dose (2.4)** — são o coração do app.
- **Web**: enquadre em uma coluna centralizada ~640px sobre `#fafafa`. Priorize o **Painel do paciente (3.3)** — é o diferencial do produto.
- Use **exatamente os textos pt-BR** acima. Respeite os tokens de cor e os alvos de toque grandes.
- Nunca invente linguagem clínica prescritiva; mantenha o disclaimer do nível estimado onde indicado.
