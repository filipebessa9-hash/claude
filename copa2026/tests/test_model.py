"""Testes basicos do modelo. Roda com: python3 -m tests.test_model
(a partir da pasta copa2026) ou com pytest."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src import model, data_loader, backtest, ratings, knockout, simulate  # noqa: E402


def test_probabilities_sum_to_one():
    lam_a, lam_b = model.expected_goals(80, 60, model.default_params())
    pa, pd, pb, _ = model.outcome_probabilities(lam_a, lam_b)
    assert abs(pa + pd + pb - 1.0) < 1e-6
    print("ok: probabilidades somam 1")


def test_stronger_team_favored():
    p = model.default_params()
    lam_a, lam_b = model.expected_goals(90, 60, p)
    pa, pd, pb, _ = model.outcome_probabilities(lam_a, lam_b)
    assert pa > pb, "time mais forte deveria ser favorito"
    print("ok: time mais forte e favorito")


def test_home_advantage():
    p = model.default_params()
    la0, lb0 = model.expected_goals(70, 70, p)
    la1, lb1 = model.expected_goals(70, 70, p, home_a=True)
    assert la1 > la0 and lb1 == lb0
    print("ok: mando de campo aumenta gols esperados do mandante")


def test_h2h_term_sign():
    table = {("A", "B"): {"a_wins": 8, "draws": 1, "b_wins": 1}}
    assert model.h2h_term("A", "B", table) > 0
    assert model.h2h_term("B", "A", table) < 0
    print("ok: termo de confronto direto tem sinal correto")


def test_backtest_runs():
    bt = data_loader.load_backtest()
    h2h = data_loader.load_h2h()
    m = backtest.evaluate(model.default_params(), bt, h2h)
    assert m["n"] == len(bt["matches"])
    assert 0.0 <= m["accuracy"] <= 1.0
    # Modelo razoavel deve superar o acaso (33%).
    assert m["accuracy"] > 0.40
    print(f"ok: backtest roda ({m['n']} jogos, acuracia {m['accuracy']*100:.1f}%)")


def test_feature_table_normalized():
    teams = data_loader.load_teams()
    feats = ratings.make_feature_table(ratings.raw_from_teams(teams))
    ranks = [f["rank"] for f in feats.values()]
    assert abs(max(ranks) - 100.0) < 1e-6 and abs(min(ranks) - 0.0) < 1e-6
    print("ok: indice de ranking normalizado em 0-100")


def test_third_allocation_respects_constraints():
    # Um conjunto de 8 grupos de terceiros deve ser alocado respeitando as vagas.
    groups = list("ABCDEFGH")
    alloc = knockout.assign_thirds(groups)
    assert len(alloc) == 8, "todas as 8 vagas devem ser preenchidas"
    for slot, g in alloc.items():
        assert g in knockout.THIRD_SLOTS[slot], "vaga viola restricao de grupo"
    print("ok: alocacao dos melhores terceiros respeita as restricoes")


def test_bracket_produces_champion():
    teams = data_loader.load_teams()
    h2h = data_loader.load_h2h()
    groups = data_loader.groups_from_teams(teams)
    results, champ, runner, r32 = simulate.deterministic_bracket(
        teams, model.default_params(), h2h, groups)
    # 32 selecoes distintas na Rodada de 32.
    participantes = [t for pair in r32.values() for t in pair]
    assert len(set(participantes)) == 32
    assert champ in teams and runner in teams and champ != runner
    print(f"ok: bracket completo gera campeao ({champ}) e vice ({runner})")


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in fns:
        fn()
    print(f"\n{len(fns)} testes passaram.")
