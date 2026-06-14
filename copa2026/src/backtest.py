"""Validacao da acuracia do modelo contra resultados reais (Copa 2022)."""

import math

from . import model, ratings


def _result_class(ag, bg):
    if ag > bg:
        return 0  # vitoria do mandante (a)
    if ag == bg:
        return 1  # empate
    return 2      # vitoria do visitante (b)


def evaluate(params, backtest_data, h2h_table=None):
    """Mede acuracia, log-loss e Brier dos parametros no conjunto de teste.

    Retorna dict com metricas e a lista de predicoes por jogo.
    """
    h2h_table = h2h_table or {}
    feats = ratings.make_feature_table(backtest_data["ratings"])
    strength = ratings.strengths(feats, params["weights"])

    n = 0
    correct = 0
    logloss = 0.0
    brier = 0.0
    predictions = []
    eps = 1e-12

    for m in backtest_data["matches"]:
        a, b = m["a"], m["b"]
        if a not in strength or b not in strength:
            continue
        term = model.h2h_term(a, b, h2h_table)
        lam_a, lam_b = model.expected_goals(
            strength[a], strength[b], params, h2h_term=term)
        pa, pd, pb, score = model.outcome_probabilities(lam_a, lam_b)
        probs = [pa, pd, pb]

        actual = _result_class(m["ag"], m["bg"])
        pred = max(range(3), key=lambda i: probs[i])
        if pred == actual:
            correct += 1
        logloss += -math.log(max(probs[actual], eps))
        brier += sum((probs[i] - (1.0 if i == actual else 0.0)) ** 2
                     for i in range(3))
        n += 1
        predictions.append({
            "match": f"{a} x {b}", "probs": probs,
            "pred_score": score, "actual": (m["ag"], m["bg"]),
            "hit": pred == actual,
        })

    return {
        "n": n,
        "accuracy": correct / n if n else 0.0,
        "logloss": logloss / n if n else 0.0,
        "brier": brier / n if n else 0.0,
        "predictions": predictions,
    }
