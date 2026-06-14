#!/usr/bin/env python3
"""
Algoritmo de predicao da Copa do Mundo 2026.

Fluxo:
  1. Carrega as bases (48 selecoes, confrontos diretos, validacao Copa 2022).
  2. Mede a acuracia do modelo-base (parametros iniciais) contra a Copa 2022.
  3. Calibra automaticamente os pesos/parametros para melhorar a predicao.
  4. Reporta a acuracia ANTES e DEPOIS da correcao.
  5. Aplica os melhores parametros e gera as predicoes da Copa 2026:
     - tabela esperada de cada grupo;
     - probabilidades de avanco, semifinal, final e titulo (Monte Carlo).

Uso:
  python3 main.py                      # roda tudo (calibracao + simulacao)
  python3 main.py --sims 50000         # mais simulacoes
  python3 main.py --no-calibrate       # usa parametros-base
  python3 main.py --predict "Brazil|France"   # previsao de um jogo
"""

import argparse
import sys

from src import calibrate, data_loader, model, simulate, backtest


def _fmt_pct(d, top=None):
    items = sorted(d.items(), key=lambda x: x[1], reverse=True)
    if top:
        items = items[:top]
    return items


def print_metrics(title, m):
    print(f"  {title}")
    print(f"    Jogos avaliados : {m['n']}")
    print(f"    Acuracia (acerto do resultado): {m['accuracy']*100:5.1f}%")
    print(f"    Log-loss (menor=melhor)       : {m['logloss']:.4f}")
    print(f"    Brier    (menor=melhor)       : {m['brier']:.4f}")


def predict_single(teams, params, h2h_table, a, b):
    from src import ratings
    feats = ratings.make_feature_table(ratings.raw_from_teams(teams))
    strength = ratings.strengths(feats, params["weights"])
    if a not in strength or b not in strength:
        print(f"Selecao desconhecida: {a if a not in strength else b}")
        return
    term = model.h2h_term(a, b, h2h_table)
    lam_a, lam_b = model.expected_goals(
        strength[a], strength[b], params,
        home_a=teams[a]["host"], home_b=teams[b]["host"], h2h_term=term)
    pa, pd, pb, score = model.outcome_probabilities(lam_a, lam_b)
    print(f"\n=== Previsao: {a} x {b} ===")
    print(f"  Forca: {a} {strength[a]:.1f}  |  {b} {strength[b]:.1f}")
    print(f"  Gols esperados: {a} {lam_a:.2f} - {lam_b:.2f} {b}")
    print(f"  Vitoria {a}: {pa*100:5.1f}%  | Empate: {pd*100:5.1f}%"
          f"  | Vitoria {b}: {pb*100:5.1f}%")
    print(f"  Placar mais provavel: {a} {score[0]} x {score[1]} {b}")


def main():
    ap = argparse.ArgumentParser(description="Predicao da Copa do Mundo 2026")
    ap.add_argument("--sims", type=int, default=20000,
                    help="numero de simulacoes Monte Carlo (padrao 20000)")
    ap.add_argument("--iters", type=int, default=4000,
                    help="iteracoes da busca de calibracao (padrao 4000)")
    ap.add_argument("--no-calibrate", action="store_true",
                    help="usa os parametros-base, sem calibracao")
    ap.add_argument("--predict", type=str, default=None,
                    help='prever um jogo, formato "TimeA|TimeB"')
    args = ap.parse_args()

    teams = data_loader.load_teams()
    h2h_table = data_loader.load_h2h()
    groups = data_loader.groups_from_teams(teams)
    datasets = data_loader.load_backtests()
    samples = backtest.build_samples(datasets, h2h_table)

    print("=" * 64)
    print(" ALGORITMO DE PREDICAO - COPA DO MUNDO 2026")
    print("=" * 64)
    comps = ", ".join(f"{ds['name']} ({len(ds['matches'])})" for ds in datasets)
    print(f"  Selecoes: {len(teams)}  |  Grupos: {len(groups)}")
    print(f"  Base de validacao: {len(samples)} jogos -> {comps}")

    # ---- 1. Acuracia do modelo-base ------------------------------------
    print("\n[1] VALIDACAO DO MODELO-BASE (contra resultados reais)")
    baseline_params = model.default_params()
    baseline_metrics = backtest.evaluate_samples(baseline_params, samples)
    print_metrics("Modelo-base (pesos iniciais):", baseline_metrics)

    # ---- 2. Calibracao (correcao) --------------------------------------
    if args.no_calibrate:
        best_params, best_metrics = baseline_params, baseline_metrics
        print("\n[2] CALIBRACAO: desativada (--no-calibrate)")
    else:
        print("\n[2] CALIBRACAO AUTOMATICA (ajustando pesos para melhorar a acuracia)")
        res = calibrate.calibrate(samples, n_iter=args.iters, verbose=True)
        best_params = res["best_params"]
        best_metrics = res["best_metrics"]
        print_metrics("Modelo calibrado (conjunto completo):", best_metrics)

        print("\n  Validacao cruzada 5-fold (acuracia honesta em jogos NAO vistos):")
        cv = calibrate.cross_validate(samples, n_iter=max(600, args.iters // 4))
        print(f"    Acuracia (held-out): {cv['accuracy']*100:5.1f}%")
        print(f"    Log-loss (held-out): {cv['logloss']:.4f}")
        print(f"    Brier    (held-out): {cv['brier']:.4f}")

        print("\n  Acuracia por competicao (modelo calibrado):")
        for comp, m in backtest.by_competition(best_params, datasets, h2h_table).items():
            print(f"    {comp:10s}: {m['accuracy']*100:5.1f}%  "
                  f"(log-loss {m['logloss']:.3f}, n={m['n']})")

        d_acc = (best_metrics["accuracy"] - baseline_metrics["accuracy"]) * 100
        d_ll = baseline_metrics["logloss"] - best_metrics["logloss"]
        print(f"\n  >> Ganho de acuracia: {d_acc:+.1f} ponto(s) percentual(is)")
        print(f"  >> Reducao de log-loss: {d_ll:+.4f}")
        print("\n  Pesos calibrados (importancia de cada fator):")
        for f, w in sorted(best_params["weights"].items(),
                           key=lambda x: x[1], reverse=True):
            nome = {"rank": "Ranking FIFA", "squad": "Qualidade do elenco",
                    "coach": "Tecnico", "form": "Forma (4 anos)",
                    "tactical": "Esquema tatico"}[f]
            print(f"    {nome:22s}: {w*100:4.1f}%")
        print(f"    {'Vantagem de mando':22s}: {best_params['home_adv']:.2f}")
        print(f"    {'Peso confronto direto':22s}: {best_params['h2h_weight']:.2f}")
        print(f"    {'Sensibilidade (k)':22s}: {best_params['k']:.2f}")

    # ---- Previsao de jogo unico (opcional) -----------------------------
    if args.predict:
        try:
            a, b = [x.strip() for x in args.predict.split("|")]
        except ValueError:
            print('Formato invalido. Use --predict "TimeA|TimeB"')
            sys.exit(1)
        predict_single(teams, best_params, h2h_table, a, b)
        return

    # ---- 3. Tabela esperada por grupo ----------------------------------
    print("\n[3] PREDICAO DA FASE DE GRUPOS (pontos esperados)")
    tables = simulate.expected_group_table(teams, best_params, h2h_table, groups)
    for g, ranked in tables.items():
        linha = "  Grupo {}: ".format(g)
        partes = []
        for pos, (t, pts) in enumerate(ranked, 1):
            marca = "*" if pos <= 2 else " "
            partes.append(f"{marca}{t} ({pts})")
        print(linha + " > ".join(partes))
    print("  (* = classificacao direta projetada; alem destes, avancam os "
          "8 melhores terceiros)")

    # ---- 4. Monte Carlo: probabilidades --------------------------------
    print(f"\n[4] SIMULACAO MONTE CARLO ({args.sims} torneios)")
    sim = simulate.monte_carlo(teams, best_params, h2h_table, groups,
                               n_sims=args.sims)

    print("\n  >> PROBABILIDADE DE TITULO (Top 12):")
    for t, p in _fmt_pct(sim["champion"], top=12):
        print(f"     {t:22s} {p:5.1f}%")

    print("\n  >> PROBABILIDADE DE CHEGAR A FINAL (Top 10):")
    for t, p in _fmt_pct(sim["final"], top=10):
        print(f"     {t:22s} {p:5.1f}%")

    print("\n  >> PROBABILIDADE DE AVANCAR DA FASE DE GRUPOS (Top 16):")
    for t, p in _fmt_pct(sim["advance"], top=16):
        print(f"     {t:22s} {p:5.1f}%")

    print("\n" + "=" * 64)
    champ = _fmt_pct(sim["champion"], top=1)[0]
    print(f" FAVORITO AO TITULO: {champ[0]} ({champ[1]:.1f}%)")
    print("=" * 64)


if __name__ == "__main__":
    main()
