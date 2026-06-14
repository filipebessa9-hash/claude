# Algoritmo de Predição — Copa do Mundo 2026 🏆

Modelo de predição dos resultados da Copa do Mundo 2026 (sede: EUA, Canadá e
México). Combina os fatores pedidos em um **índice de força** por seleção e
converte a diferença de força em **gols esperados** via um modelo de Poisson,
gerando probabilidades de vitória/empate/derrota, tabelas de grupo e
probabilidades de título por simulação de Monte Carlo.

O algoritmo é **auto-validado e auto-calibrado**: ele roda contra os resultados
reais da Copa de 2022 para medir a acurácia e ajusta seus próprios pesos para
melhorar a predição.

> Sem dependências externas — roda só com a biblioteca padrão do Python 3.

## Como rodar

```bash
cd copa2026

# Roda tudo: validação + calibração + predição da Copa 2026
python3 main.py

# Mais simulações / mais iterações de calibração (mais preciso, mais lento)
python3 main.py --sims 50000 --iters 8000

# Sem calibração (usa os pesos teóricos iniciais)
python3 main.py --no-calibrate

# Previsão de um jogo específico
python3 main.py --no-calibrate --predict "Brazil|France"

# Testes
python3 -m tests.test_model
```

## Fatores considerados (pedidos no enunciado)

| Fator | Campo | De onde vem |
|-------|-------|-------------|
| Ranking FIFA | `rank` | Pontos do ranking FIFA (jun/2026), normalizados 0–100 |
| Qualidade técnica do elenco / estatísticas | `squad` | Índice 0–100 por qualidade e estatísticas dos jogadores |
| Qualidade/experiência do técnico | `coach` | Índice 0–100 |
| Retrospecto dos últimos 4 anos (amistosos, Copa 2022, competições) | `form` | Índice 0–100 de forma recente |
| Esquema tático | `tactical` | Índice 0–100 de solidez/flexibilidade tática |
| Confronto direto histórico | `head_to_head.json` | Vitórias/empates entre as seleções |
| Mando (país-sede) | `host` | Vantagem para EUA/Canadá/México |

## Como funciona

1. **Índice de força** de cada seleção:
   `R = w_rank·rank + w_squad·squad + w_coach·coach + w_form·form + w_tat·tat`
   (pesos somam 1).
2. **Gols esperados** num jogo A×B (Poisson):
   `λ_A = média · exp( k·(R_A − R_B)/10 + mando_A + h2h )`
   (e simétrico para B). A média base é ~1,35 gol por equipe.
3. **Probabilidades** de vitória/empate/derrota e placar mais provável: somando
   a Poisson bivariada (independente) sobre os placares 0–8.
4. **Fase de grupos**: round-robin; classificam os 2 primeiros de cada grupo +
   os 8 melhores terceiros (formato oficial de 48 seleções → 32 no mata-mata).
5. **Mata-mata**: simulação de Monte Carlo; empates decididos por "pênaltis"
   (leve vantagem ao mais forte).
6. **Saída**: probabilidades de avanço, semifinal, final e título.

## Validação e correção da acurácia

O ponto central do pedido — *"rode o algoritmo para verificar a acurácia,
fazendo correções para melhorar a predição"* — está implementado assim:

- **Conjunto de validação**: 39 jogos reais da Copa de 2022, com os ratings
  pré-torneio das seleções (`data/backtest_wc2022.json`).
- **Métricas**: acurácia (acerto do resultado), **log-loss** e **Brier score**
  (medem a qualidade das *probabilidades*, não só do palpite).
- **Calibração automática** (`src/calibrate.py`): busca aleatória + refino local
  ajusta os pesos e parâmetros para minimizar o log-loss.

### Correções aplicadas contra overfitting

A primeira versão da calibração **colapsou** num resultado degenerado
("Técnico = 98%"): com apenas 39 jogos, o otimizador decorou o conjunto em vez
de generalizar. Correções feitas:

1. **Piso mínimo por fator** (5%): nenhum fator pode dominar sozinho.
2. **Regularização L2**: penaliza pesos que se afastam do prior teórico.
3. **Validação cruzada 5-fold**: calibra no treino e mede em jogos *não vistos*,
   dando uma estimativa **honesta** de acurácia (evita superestimar olhando só
   para o conjunto memorizado).

Resultado típico: ~56% de acurácia (vs. 33% do acaso) e melhora consistente do
log-loss após a calibração, com pesos distribuídos de forma plausível.

## Estrutura

```
copa2026/
├── main.py                      # orquestra validação + calibração + predição
├── data/
│   ├── teams_2026.json          # 48 seleções, grupos e fatores
│   ├── head_to_head.json        # confrontos diretos históricos
│   └── backtest_wc2022.json     # conjunto de validação (Copa 2022)
├── src/
│   ├── model.py                 # força, gols esperados (Poisson), probabilidades
│   ├── ratings.py               # montagem dos vetores de fatores
│   ├── backtest.py              # métricas de acurácia
│   ├── calibrate.py             # calibração + validação cruzada
│   ├── simulate.py              # Monte Carlo do torneio
│   └── data_loader.py           # carga das bases
└── tests/test_model.py          # testes
```

## Limitações e como melhorar

- Os índices 0–100 (`squad`, `coach`, `form`, `tactical`) são **estimativas
  curadas** — fáceis de editar em `data/teams_2026.json`. Quanto melhores os
  dados de entrada, melhor a predição.
- Os pontos do ranking FIFA e a composição dos grupos refletem o sorteio de
  dez/2025; ajuste se houver mudanças.
- O chaveamento do mata-mata usa *reseeding* por força (mais forte × mais fraco),
  uma **aproximação** do chaveamento oficial, mais complexo.
- Para acurácia mais robusta, amplie `backtest_wc2022.json` com mais jogos
  (Eliminatórias, Nations League, Copa América, Eurocopa) — o pipeline de
  validação/calibração aproveita automaticamente.

## Fontes dos dados

- [Ranking FIFA Masculino](https://www.fifa.com/fifa-world-ranking/men) (jun/2026)
- [Sorteio da Copa do Mundo 2026 (FIFA)](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/final-draw-results)
- Resultados da Copa do Mundo de 2022 (registros públicos).
