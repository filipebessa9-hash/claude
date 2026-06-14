#!/usr/bin/env python3
"""
Gera o RELATORIO COMPLETO do mata-mata da Copa 2026 (RELATORIO_MATA_MATA.md).

Usa o chaveamento OFICIAL (partidas 73-104). Produz:
  - o "caminho mais provavel" rodada a rodada (Rodada de 32 -> Final),
    com vencedor previsto, placar e probabilidade de avancar em cada jogo;
  - as probabilidades, via Monte Carlo, de cada selecao alcancar cada fase
    (Oitavas, Quartas, Semi, Final e Titulo).

Uso:
  python3 gerar_relatorio_mata_mata.py [--sims 30000] [--iters 5000] [--no-calibrate]
"""

import argparse
import datetime

from src import backtest, calibrate, data_loader, knockout, model, simulate


def pct(x):
    return f"{x*100:.0f}%"


def fmt_score(info):
    s = info["score"]
    draw = " (pên.)" if s[0] == s[1] else ""
    return f"{s[0]}–{s[1]}{draw}"


def winner_prob(info, a, w):
    """Probabilidade do vencedor previsto avancar."""
    p = info["p_a_adv"] if w == a else (1 - info["p_a_adv"])
    return p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sims", type=int, default=30000)
    ap.add_argument("--iters", type=int, default=5000)
    ap.add_argument("--no-calibrate", action="store_true")
    ap.add_argument("--out", default="RELATORIO_MATA_MATA.md")
    args = ap.parse_args()

    teams = data_loader.load_teams()
    h2h = data_loader.load_h2h()
    groups = data_loader.groups_from_teams(teams)
    datasets = data_loader.load_backtests()
    samples = backtest.build_samples(datasets, h2h)

    if args.no_calibrate:
        params = model.default_params()
        cv = None
    else:
        print("Calibrando...")
        params = calibrate.calibrate(samples, n_iter=args.iters, verbose=False)["best_params"]
        cv = calibrate.cross_validate(samples, n_iter=max(600, args.iters // 4))
    metrics = backtest.evaluate_samples(params, samples)

    print("Montando o bracket previsto e simulando ({}x)...".format(args.sims))
    results, champ, runner, r32 = simulate.deterministic_bracket(
        teams, params, h2h, groups)
    sim = simulate.monte_carlo_bracket(teams, params, h2h, groups, n_sims=args.sims)

    L = []
    w = L.append
    w("# Relatório de Predição — Mata-Mata · Copa do Mundo 2026\n")
    w(f"*Gerado em {datetime.date.today().isoformat()} · chaveamento oficial "
      f"(partidas 73–104) · {args.sims:,} simulações de Monte Carlo*\n")
    w("> O chaveamento do mata-mata é o **oficial** do sorteio/regulamento da "
      "FIFA. A alocação das 8 vagas de melhor-terceiro respeita as restrições "
      "de grupo de cada vaga (matching), já que a tabela de 495 cenários da "
      "FIFA não é reproduzida aqui.\n")
    w(f"Acurácia do modelo (validado em {len(samples)} jogos reais): "
      f"**{pct(metrics['accuracy'])}** de acerto"
      + (f" · validação cruzada {pct(cv['accuracy'])} em jogos não vistos" if cv else "")
      + ".\n")

    # ---------- Caminho mais provável ----------
    def render_round(title, ids_with_sources, is_r32=False):
        w(f"### {title}\n")
        w("| Jogo | Confronto | Vencedor previsto | Placar | Prob. avançar |")
        w("|:----:|-----------|-------------------|:------:|:-------------:|")
        for item in ids_with_sources:
            mid = item if is_r32 else item[0]
            a, b, win, info = results[mid]
            loser = b if win == a else a
            w(f"| {mid} | {a} × {b} | **{win}** | {fmt_score(info)} | "
              f"{pct(winner_prob(info, a, win))} |")
        w("")

    w("---\n\n## 🛣️ Caminho mais provável (cenário modal)\n")
    w("Em cada confronto, o modelo aponta o lado com maior probabilidade de "
      "avançar (empates no tempo normal são resolvidos como pênaltis).\n")
    render_round("Rodada de 32", [m[0] for m in knockout.R32], is_r32=True)
    render_round("Oitavas de final", knockout.R16)
    render_round("Quartas de final", knockout.QF)
    render_round("Semifinais", knockout.SF)

    # Disputa de 3o lugar (perdedores das semis)
    tour = simulate.Tournament(teams, params, h2h)
    (a1, b1, w1, _) = results[knockout.SF[0][0]]
    (a2, b2, w2, _) = results[knockout.SF[1][0]]
    l1 = b1 if w1 == a1 else a1
    l2 = b2 if w2 == a2 else a2
    tp_winner, tp_info = tour.decide_ml(l1, l2)
    fmid = knockout.FINAL[0]
    fa, fb, fw, finfo = results[fmid]

    w("### Final e 3º lugar\n")
    w("| Jogo | Confronto | Vencedor previsto | Placar | Prob. |")
    w("|:----:|-----------|-------------------|:------:|:-----:|")
    w(f"| 103 (3º lugar) | {l1} × {l2} | **{tp_winner}** | {fmt_score(tp_info)} | "
      f"{pct(winner_prob(tp_info, l1, tp_winner))} |")
    w(f"| 104 (FINAL) | {fa} × {fb} | **{fw}** | {fmt_score(finfo)} | "
      f"{pct(winner_prob(finfo, fa, fw))} |")
    w("")
    w(f"## 🏆 Campeão previsto: **{champ}**  ·  🥈 Vice: {runner}\n")

    # ---------- Probabilidades por fase ----------
    w("---\n\n## 📊 Probabilidade de alcançar cada fase (Monte Carlo)\n")
    order = ["r16", "qf", "sf", "final", "champion"]
    labels = {"r16": "Oitavas", "qf": "Quartas", "sf": "Semi",
              "final": "Final", "champion": "Título"}
    top = sorted(sim["champion"].items(), key=lambda x: -x[1])[:20]
    w("| Seleção | " + " | ".join(labels[o] for o in order) + " |")
    w("|---------|" + "|".join([":---:"] * len(order)) + "|")
    for t, _ in top:
        row = " | ".join(f"{sim[o].get(t,0):.0f}%" for o in order)
        w(f"| {t} | {row} |")
    w("")
    w("---")
    w("\n*Modelo probabilístico — o caminho mais provável é o cenário modal, "
      "não uma certeza; as zebras estão embutidas nas probabilidades. "
      "Veja também `RELATORIO_FASE_GRUPOS.md`.*")

    with open(args.out, "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    print(f"Relatorio escrito em: {args.out}")


if __name__ == "__main__":
    main()
