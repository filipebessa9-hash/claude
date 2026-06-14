# Relatório de Predição — Fase de Grupos · Copa do Mundo 2026

*Gerado em 2026-06-14 · sedes: EUA, Canadá e México · 40,000 simulações de Monte Carlo*

## Como a predição foi feita

Cada seleção recebe um **índice de força** que combina os fatores abaixo; a diferença de força entre dois times é convertida em **gols esperados** (modelo de Poisson), gerando as probabilidades de cada resultado. A fase de grupos foi simulada milhares de vezes.

**Pesos dos fatores (calibrados automaticamente):**

| Fator | Peso |
|-------|------|
| Forma (últimos 4 anos) | 34.7% |
| Esquema tático | 24.0% |
| Técnico (qualidade/experiência) | 20.1% |
| Qualidade do elenco/estatísticas | 16.4% |
| Ranking FIFA | 4.8% |
| *Vantagem de mando (sede)* | 0.00 |
| *Peso do confronto direto* | 0.00 |

**Acurácia do modelo** (validado contra resultados reais de 115 jogos: Copa 2022, Eurocopa 2024 e Copa América 2024):

| Métrica | Modelo-base | Modelo calibrado |
|---------|-------------|------------------|
| Acerto do resultado | 57% | **58%** |
| Log-loss (↓ melhor) | 0.977 | **0.895** |
| Brier (↓ melhor) | 0.566 | **0.518** |

> Validação cruzada 5-fold (acurácia honesta em jogos NÃO vistos): **58%** · log-loss 0.917.

Acurácia por competição: copa2024 64% · euro2024 56% · wc2022 56%

> O acaso acerta ~33% (3 resultados). ~58% é um patamar forte para predição de futebol.

---

## Predição grupo a grupo

### Grupo A

**Jogos previstos:**

| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |
|-----------|:---------:|:------:|:---------:|:---------------:|
| Mexico × South Korea | 33% | 27% | 40% | 1–1 |
| Mexico × Czechia | 50% | 26% | 24% | 1–0 |
| Mexico × South Africa | 58% | 23% | 18% | 1–0 |
| South Korea × Czechia | 54% | 25% | 22% | 1–0 |
| South Korea × South Africa | 62% | 22% | 16% | 1–0 |
| Czechia × South Africa | 45% | 27% | 29% | 1–1 |

**Classificação projetada:**

| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |
|:---:|---------|:-------------:|:-----:|:-----:|:----------:|
| 1 🟢 | South Korea | 5.42 | 45% | 29% | 89% |
| 2 🟢 | Mexico | 5.00 | 34% | 32% | 84% |
| 3 🟡 | Czechia | 3.48 | 14% | 23% | 61% |
| 4  | South Africa | 2.61 | 7% | 15% | 43% |

**Classificados projetados:** 🥇 South Korea · 🥈 Mexico  *(3º Czechia disputa vaga de melhor terceiro)*

### Grupo B

**Jogos previstos:**

| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |
|-----------|:---------:|:------:|:---------:|:---------------:|
| Switzerland × Canada | 53% | 25% | 22% | 1–0 |
| Switzerland × Bosnia and Herzegovina | 60% | 23% | 17% | 1–0 |
| Switzerland × Qatar | 66% | 21% | 14% | 1–0 |
| Canada × Bosnia and Herzegovina | 43% | 27% | 30% | 1–1 |
| Canada × Qatar | 48% | 26% | 26% | 1–1 |
| Bosnia and Herzegovina × Qatar | 42% | 27% | 31% | 1–1 |

**Classificação projetada:**

| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |
|:---:|---------|:-------------:|:-----:|:-----:|:----------:|
| 1 🟢 | Switzerland | 6.05 | 58% | 24% | 93% |
| 2 🟢 | Canada | 4.17 | 21% | 32% | 74% |
| 3 🟡 | Bosnia and Herzegovina | 3.46 | 13% | 25% | 61% |
| 4  | Qatar | 2.85 | 8% | 18% | 48% |

**Classificados projetados:** 🥇 Switzerland · 🥈 Canada  *(3º Bosnia and Herzegovina disputa vaga de melhor terceiro)*

### Grupo C

**Jogos previstos:**

| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |
|-----------|:---------:|:------:|:---------:|:---------------:|
| Brazil × Morocco | 40% | 27% | 33% | 1–1 |
| Brazil × Scotland | 71% | 18% | 11% | 2–0 |
| Brazil × Haiti | 93% | 6% | 2% | 3–0 |
| Morocco × Scotland | 68% | 19% | 12% | 2–0 |
| Morocco × Haiti | 91% | 7% | 2% | 3–0 |
| Scotland × Haiti | 68% | 20% | 12% | 2–0 |

**Classificação projetada:**

| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |
|:---:|---------|:-------------:|:-----:|:-----:|:----------:|
| 1 🟢 | Brazil | 6.61 | 52% | 38% | 99% |
| 2 🟢 | Morocco | 6.32 | 43% | 45% | 98% |
| 3 🟡 | Scotland | 3.30 | 5% | 16% | 67% |
| 4  | Haiti | 0.81 | 0% | 1% | 7% |

**Classificados projetados:** 🥇 Brazil · 🥈 Morocco  *(3º Scotland disputa vaga de melhor terceiro)*

### Grupo D

**Jogos previstos:**

| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |
|-----------|:---------:|:------:|:---------:|:---------------:|
| USA × Australia | 46% | 26% | 28% | 1–1 |
| USA × Turkiye | 32% | 27% | 41% | 1–1 |
| USA × Paraguay | 43% | 27% | 30% | 1–1 |
| Australia × Turkiye | 24% | 25% | 51% | 0–1 |
| Australia × Paraguay | 34% | 27% | 39% | 1–1 |
| Turkiye × Paraguay | 48% | 26% | 26% | 1–1 |

**Classificação projetada:**

| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |
|:---:|---------|:-------------:|:-----:|:-----:|:----------:|
| 1 🟢 | Turkiye | 4.96 | 39% | 27% | 83% |
| 2 🟢 | USA | 4.43 | 29% | 28% | 76% |
| 3 🟡 | Paraguay | 3.68 | 18% | 24% | 64% |
| 4  | Australia | 3.35 | 14% | 21% | 56% |

**Classificados projetados:** 🥇 Turkiye · 🥈 USA  *(3º Paraguay disputa vaga de melhor terceiro)*

### Grupo E

**Jogos previstos:**

| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |
|-----------|:---------:|:------:|:---------:|:---------------:|
| Germany × Ecuador | 58% | 23% | 19% | 1–0 |
| Germany × Cote d'Ivoire | 58% | 23% | 19% | 1–0 |
| Germany × Curacao | 84% | 11% | 5% | 2–0 |
| Ecuador × Cote d'Ivoire | 36% | 27% | 36% | 1–1 |
| Ecuador × Curacao | 66% | 20% | 13% | 2–0 |
| Cote d'Ivoire × Curacao | 66% | 20% | 13% | 2–0 |

**Classificação projetada:**

| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |
|:---:|---------|:-------------:|:-----:|:-----:|:----------:|
| 1 🟢 | Germany | 6.59 | 64% | 25% | 97% |
| 2 🟢 | Cote d'Ivoire | 4.35 | 18% | 35% | 80% |
| 3 🟡 | Ecuador | 4.35 | 17% | 34% | 80% |
| 4  | Curacao | 1.46 | 1% | 6% | 18% |

**Classificados projetados:** 🥇 Germany · 🥈 Cote d'Ivoire  *(3º Ecuador disputa vaga de melhor terceiro)*

### Grupo F

**Jogos previstos:**

| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |
|-----------|:---------:|:------:|:---------:|:---------------:|
| Netherlands × Japan | 45% | 27% | 28% | 1–1 |
| Netherlands × Sweden | 70% | 19% | 11% | 2–0 |
| Netherlands × Tunisia | 79% | 14% | 7% | 2–0 |
| Japan × Sweden | 62% | 22% | 16% | 1–0 |
| Japan × Tunisia | 72% | 18% | 10% | 2–0 |
| Sweden × Tunisia | 47% | 26% | 27% | 1–1 |

**Classificação projetada:**

| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |
|:---:|---------|:-------------:|:-----:|:-----:|:----------:|
| 1 🟢 | Netherlands | 6.43 | 58% | 31% | 97% |
| 2 🟢 | Japan | 5.52 | 34% | 44% | 92% |
| 3 🟡 | Sweden | 2.89 | 6% | 17% | 53% |
| 4  | Tunisia | 1.90 | 2% | 9% | 28% |

**Classificados projetados:** 🥇 Netherlands · 🥈 Japan  *(3º Sweden disputa vaga de melhor terceiro)*

### Grupo G

**Jogos previstos:**

| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |
|-----------|:---------:|:------:|:---------:|:---------------:|
| Belgium × Iran | 56% | 24% | 20% | 1–0 |
| Belgium × Egypt | 54% | 25% | 22% | 1–0 |
| Belgium × New Zealand | 82% | 13% | 6% | 2–0 |
| Iran × Egypt | 35% | 27% | 38% | 1–1 |
| Iran × New Zealand | 65% | 21% | 14% | 1–0 |
| Egypt × New Zealand | 67% | 20% | 13% | 2–0 |

**Classificação projetada:**

| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |
|:---:|---------|:-------------:|:-----:|:-----:|:----------:|
| 1 🟢 | Belgium | 6.34 | 59% | 26% | 96% |
| 2 🟢 | Egypt | 4.53 | 21% | 35% | 82% |
| 3 🟡 | Iran | 4.33 | 18% | 33% | 80% |
| 4  | New Zealand | 1.51 | 2% | 6% | 19% |

**Classificados projetados:** 🥇 Belgium · 🥈 Egypt  *(3º Iran disputa vaga de melhor terceiro)*

### Grupo H

**Jogos previstos:**

| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |
|-----------|:---------:|:------:|:---------:|:---------------:|
| Spain × Uruguay | 67% | 20% | 13% | 2–0 |
| Spain × Saudi Arabia | 95% | 4% | 1% | 4–0 |
| Spain × Cabo Verde | 96% | 3% | 1% | 4–0 |
| Uruguay × Saudi Arabia | 78% | 15% | 7% | 2–0 |
| Uruguay × Cabo Verde | 80% | 13% | 6% | 2–0 |
| Saudi Arabia × Cabo Verde | 39% | 27% | 34% | 1–1 |

**Classificação projetada:**

| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |
|:---:|---------|:-------------:|:-----:|:-----:|:----------:|
| 1 🟢 | Spain | 8.00 | 85% | 15% | 100% |
| 2 🟢 | Uruguay | 5.61 | 15% | 74% | 96% |
| 3 🟡 | Saudi Arabia | 1.89 | 0% | 6% | 26% |
| 4  | Cabo Verde | 1.67 | 0% | 5% | 21% |

**Classificados projetados:** 🥇 Spain · 🥈 Uruguay  *(3º Saudi Arabia disputa vaga de melhor terceiro)*

### Grupo I

**Jogos previstos:**

| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |
|-----------|:---------:|:------:|:---------:|:---------------:|
| France × Senegal | 75% | 16% | 9% | 2–0 |
| France × Norway | 81% | 13% | 6% | 2–0 |
| France × Iraq | 95% | 4% | 1% | 4–0 |
| Senegal × Norway | 44% | 27% | 29% | 1–1 |
| Senegal × Iraq | 72% | 18% | 10% | 2–0 |
| Norway × Iraq | 64% | 21% | 14% | 1–0 |

**Classificação projetada:**

| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |
|:---:|---------|:-------------:|:-----:|:-----:|:----------:|
| 1 🟢 | France | 7.89 | 88% | 10% | 100% |
| 2 🟢 | Senegal | 4.34 | 8% | 50% | 82% |
| 3 🟡 | Norway | 3.59 | 4% | 34% | 70% |
| 4  | Iraq | 1.20 | 0% | 5% | 13% |

**Classificados projetados:** 🥇 France · 🥈 Senegal  *(3º Norway disputa vaga de melhor terceiro)*

### Grupo J

**Jogos previstos:**

| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |
|-----------|:---------:|:------:|:---------:|:---------------:|
| Argentina × Austria | 81% | 13% | 6% | 2–0 |
| Argentina × Algeria | 91% | 7% | 2% | 3–0 |
| Argentina × Jordan | 96% | 3% | 1% | 4–0 |
| Austria × Algeria | 53% | 25% | 22% | 1–0 |
| Austria × Jordan | 67% | 20% | 13% | 2–0 |
| Algeria × Jordan | 50% | 26% | 24% | 1–0 |

**Classificação projetada:**

| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |
|:---:|---------|:-------------:|:-----:|:-----:|:----------:|
| 1 🟢 | Argentina | 8.25 | 93% | 6% | 100% |
| 2 🟢 | Austria | 4.35 | 5% | 60% | 82% |
| 3 🟡 | Algeria | 2.81 | 1% | 25% | 51% |
| 4  | Jordan | 1.64 | 0% | 9% | 22% |

**Classificados projetados:** 🥇 Argentina · 🥈 Austria  *(3º Algeria disputa vaga de melhor terceiro)*

### Grupo K

**Jogos previstos:**

| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |
|-----------|:---------:|:------:|:---------:|:---------------:|
| Portugal × Colombia | 49% | 26% | 25% | 1–1 |
| Portugal × DR Congo | 82% | 13% | 6% | 2–0 |
| Portugal × Uzbekistan | 85% | 11% | 4% | 2–0 |
| Colombia × DR Congo | 71% | 18% | 11% | 2–0 |
| Colombia × Uzbekistan | 75% | 16% | 9% | 2–0 |
| DR Congo × Uzbekistan | 40% | 27% | 32% | 1–1 |

**Classificação projetada:**

| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |
|:---:|---------|:-------------:|:-----:|:-----:|:----------:|
| 1 🟢 | Portugal | 6.96 | 65% | 29% | 99% |
| 2 🟢 | Colombia | 5.74 | 31% | 53% | 94% |
| 3 🟡 | DR Congo | 2.28 | 2% | 11% | 38% |
| 4  | Uzbekistan | 1.92 | 1% | 8% | 29% |

**Classificados projetados:** 🥇 Portugal · 🥈 Colombia  *(3º DR Congo disputa vaga de melhor terceiro)*

### Grupo L

**Jogos previstos:**

| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |
|-----------|:---------:|:------:|:---------:|:---------------:|
| England × Croatia | 42% | 27% | 31% | 1–1 |
| England × Panama | 86% | 10% | 4% | 2–0 |
| England × Ghana | 86% | 10% | 4% | 2–0 |
| Croatia × Panama | 82% | 12% | 6% | 2–0 |
| Croatia × Ghana | 82% | 12% | 6% | 2–0 |
| Panama × Ghana | 36% | 27% | 36% | 1–1 |

**Classificação projetada:**

| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |
|:---:|---------|:-------------:|:-----:|:-----:|:----------:|
| 1 🟢 | England | 6.86 | 57% | 38% | 99% |
| 2 🟢 | Croatia | 6.39 | 42% | 50% | 98% |
| 3 🟡 | Ghana | 1.88 | 1% | 6% | 28% |
| 4  | Panama | 1.88 | 1% | 6% | 28% |

**Classificados projetados:** 🥇 England · 🥈 Croatia  *(3º Ghana disputa vaga de melhor terceiro)*

---

## Disputa pelos 8 melhores terceiros

Probabilidade de um 3º colocado avançar entre os 8 melhores (P(avançar) − P(1º) − P(2º)):

| Seleção | Grupo | P(avançar como 3º) | P(avançar total) |
|---------|:-----:|:------------------:|:----------------:|
| Ecuador | E | 28% | 80% |
| Iran | G | 28% | 80% |
| Norway | I | 32% | 70% |
| Scotland | C | 47% | 67% |
| Paraguay | D | 22% | 64% |
| Czechia | A | 25% | 61% |
| Bosnia and Herzegovina | B | 23% | 61% |
| Sweden | F | 30% | 53% |
| Algeria | J | 25% | 51% |
| DR Congo | K | 26% | 38% |
| Ghana | L | 22% | 28% |
| Saudi Arabia | H | 19% | 26% |

---

## Cenário mais provável: 32 classificados ao mata-mata

**1º de cada grupo:** South Korea, Switzerland, Brazil, Turkiye, Germany, Netherlands, Belgium, Spain, France, Argentina, Portugal, England

**2º de cada grupo:** Mexico, Canada, Morocco, USA, Cote d'Ivoire, Japan, Egypt, Uruguay, Senegal, Austria, Colombia, Croatia

**8 melhores terceiros (projeção):** Ecuador, Iran, Norway, Scotland, Paraguay, Czechia, Bosnia and Herzegovina, Sweden

---

## Contexto: favoritos ao título

| Seleção | Prob. de título |
|---------|:---------------:|
| Argentina | 36.6% |
| Spain | 25.5% |
| France | 19.2% |
| England | 4.7% |
| Portugal | 3.9% |
| Brazil | 2.3% |
| Croatia | 2.0% |
| Netherlands | 1.6% |

---

*Modelo probabilístico: zebras fazem parte do futebol e do modelo. Edite `data/teams_2026.json` para refinar as estimativas de entrada.*