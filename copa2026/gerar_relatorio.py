#!/usr/bin/env python3
"""
Gera o RELATORIO COMPLETO de predicao da fase de grupos da Copa 2026.

Roda a calibracao, simula o torneio (Monte Carlo) e escreve um arquivo
Markdown (RELATORIO_FASE_GRUPOS.md) com, para cada grupo:
  - previsao de cada jogo (probabilidades + placar mais provavel);
  - classificacao projetada (pontos esperados, P(1o), P(2o), P(avancar));
  - classificados projetados.
Tambem lista os 8 melhores terceiros e as 32 selecoes classificadas.

Uso:
  python3 gerar_relatorio.py [--sims 30000] [--iters 5000] [--no-calibrate]
"""

import argparse
import datetime

from src import backtest, calibrate, data_loader, model, simulate


def pct(x):
    return f"{x*100:.0f}%"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sims", type=int, default=30000)
    ap.add_argument("--iters", type=int, default=5000)
    ap.add_argument("--no-calibrate", action="store_true")
    ap.add_argument("--out", default="RELATORIO_FASE_GRUPOS.md")
    args = ap.parse_args()

    teams = data_loader.load_teams()
    h2h = data_loader.load_h2h()
    groups = data_loader.groups_from_teams(teams)
    datasets = data_loader.load_backtests()
    samples = backtest.build_samples(datasets, h2h)

    baseline = backtest.evaluate_samples(model.default_params(), samples)
    if args.no_calibrate:
        params, metrics = model.default_params(), baseline
        cv = None
        percomp = backtest.by_competition(params, datasets, h2h)
    else:
        print("Calibrando...")
        res = calibrate.calibrate(samples, n_iter=args.iters, verbose=False)
        params, metrics = res["best_params"], res["best_metrics"]
        cv = calibrate.cross_validate(samples, n_iter=max(600, args.iters // 4))
        percomp = backtest.by_competition(params, datasets, h2h)

    print("Simulando o torneio ({} vezes)...".format(args.sims))
    preds = simulate.group_match_predictions(teams, params, h2h, groups)
    exp_tbl = simulate.expected_group_table(teams, params, h2h, groups)
    sim = simulate.monte_carlo(teams, params, h2h, groups, n_sims=args.sims)

    win_g, second, adv = sim["win_group"], sim["second"], sim["advance"]

    L = []
    w = L.append
    w("# Relatório de Predição — Fase de Grupos · Copa do Mundo 2026\n")
    w(f"*Gerado em {datetime.date.today().isoformat()} · "
      f"sedes: EUA, Canadá e México · {args.sims:,} simulações de Monte Carlo*\n")

    # ---- Metodologia / acuracia ----
    w("## Como a predição foi feita\n")
    w("Cada seleção recebe um **índice de força** que combina os fatores "
      "abaixo; a diferença de força entre dois times é convertida em **gols "
      "esperados** (modelo de Poisson), gerando as probabilidades de cada "
      "resultado. A fase de grupos foi simulada milhares de vezes.\n")
    w("**Pesos dos fatores (calibrados automaticamente):**\n")
    nomes = {"rank": "Ranking FIFA", "squad": "Qualidade do elenco/estatísticas",
             "coach": "Técnico (qualidade/experiência)", "form": "Forma (últimos 4 anos)",
             "tactical": "Esquema tático"}
    w("| Fator | Peso |")
    w("|-------|------|")
    for f, val in sorted(params["weights"].items(), key=lambda x: -x[1]):
        w(f"| {nomes[f]} | {val*100:.1f}% |")
    w(f"| *Vantagem de mando (sede)* | {params['home_adv']:.2f} |")
    w(f"| *Peso do confronto direto* | {params['h2h_weight']:.2f} |")
    w("")
    w("**Acurácia do modelo** (validado contra resultados reais de "
      f"{len(samples)} jogos: Copa 2022, Eurocopa 2024 e Copa América 2024):\n")
    w("| Métrica | Modelo-base | Modelo calibrado |")
    w("|---------|-------------|------------------|")
    w(f"| Acerto do resultado | {pct(baseline['accuracy'])} | "
      f"**{pct(metrics['accuracy'])}** |")
    w(f"| Log-loss (↓ melhor) | {baseline['logloss']:.3f} | "
      f"**{metrics['logloss']:.3f}** |")
    w(f"| Brier (↓ melhor) | {baseline['brier']:.3f} | **{metrics['brier']:.3f}** |")
    if cv:
        w(f"\n> Validação cruzada 5-fold (acurácia honesta em jogos NÃO vistos): "
          f"**{pct(cv['accuracy'])}** · log-loss {cv['logloss']:.3f}.\n")
    w("Acurácia por competição: " +
      " · ".join(f"{c} {pct(m['accuracy'])}" for c, m in percomp.items()) + "\n")
    w("> O acaso acerta ~33% (3 resultados). ~58% é um patamar forte para "
      "predição de futebol.\n")

    # ---- Grupos ----
    w("---\n\n## Predição grupo a grupo\n")
    qualifiers_first = {}
    qualifiers_second = {}
    for g in sorted(groups):
        ranked = exp_tbl[g]
        w(f"### Grupo {g}\n")
        # Jogos
        w("**Jogos previstos:**\n")
        w("| Confronto | Vitória 1 | Empate | Vitória 2 | Placar provável |")
        w("|-----------|:---------:|:------:|:---------:|:---------------:|")
        for j in preds[g]:
            w(f"| {j['a']} × {j['b']} | {pct(j['pa'])} | {pct(j['pd'])} | "
              f"{pct(j['pb'])} | {j['score'][0]}–{j['score'][1]} |")
        w("")
        # Classificacao projetada
        w("**Classificação projetada:**\n")
        w("| Pos | Seleção | Pts esperados | P(1º) | P(2º) | P(avançar) |")
        w("|:---:|---------|:-------------:|:-----:|:-----:|:----------:|")
        for pos, (t, p) in enumerate(ranked, 1):
            mark = "🟢" if pos <= 2 else ("🟡" if pos == 3 else "")
            w(f"| {pos} {mark} | {t} | {p:.2f} | {pct(win_g.get(t,0)/100)} | "
              f"{pct(second.get(t,0)/100)} | {pct(adv.get(t,0)/100)} |")
        w("")
        first = ranked[0][0]
        sec = ranked[1][0]
        qualifiers_first[g] = first
        qualifiers_second[g] = sec
        w(f"**Classificados projetados:** 🥇 {first} · 🥈 {sec}  "
          f"*(3º {ranked[2][0]} disputa vaga de melhor terceiro)*\n")

    # ---- Melhores terceiros ----
    w("---\n\n## Disputa pelos 8 melhores terceiros\n")
    w("Probabilidade de um 3º colocado avançar entre os 8 melhores "
      "(P(avançar) − P(1º) − P(2º)):\n")
    thirds = []
    for g in sorted(groups):
        t = exp_tbl[g][2][0]
        p3 = max(0.0, adv.get(t, 0) - win_g.get(t, 0) - second.get(t, 0))
        thirds.append((t, g, p3, adv.get(t, 0)))
    thirds.sort(key=lambda x: x[3], reverse=True)
    w("| Seleção | Grupo | P(avançar como 3º) | P(avançar total) |")
    w("|---------|:-----:|:------------------:|:----------------:|")
    for t, g, p3, ptot in thirds:
        w(f"| {t} | {g} | {p3/100*100:.0f}% | {ptot:.0f}% |")
    w("")

    # ---- 32 classificados projetados ----
    w("---\n\n## Cenário mais provável: 32 classificados ao mata-mata\n")
    proj_thirds = [t for t, g, p3, ptot in thirds[:8]]
    w("**1º de cada grupo:** " + ", ".join(qualifiers_first[g] for g in sorted(groups)) + "\n")
    w("**2º de cada grupo:** " + ", ".join(qualifiers_second[g] for g in sorted(groups)) + "\n")
    w("**8 melhores terceiros (projeção):** " + ", ".join(proj_thirds) + "\n")

    # ---- Favoritos gerais (contexto) ----
    w("---\n\n## Contexto: favoritos ao título\n")
    champ = sorted(sim["champion"].items(), key=lambda x: -x[1])[:8]
    w("| Seleção | Prob. de título |")
    w("|---------|:---------------:|")
    for t, p in champ:
        w(f"| {t} | {p:.1f}% |")
    w("")
    w("---")
    w("\n*Modelo probabilístico: zebras fazem parte do futebol e do modelo. "
      "Edite `data/teams_2026.json` para refinar as estimativas de entrada.*")

    text = "\n".join(L)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"Relatorio escrito em: {args.out}")


if __name__ == "__main__":
    main()
