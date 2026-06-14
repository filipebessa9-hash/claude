"""Validacao da acuracia do modelo contra resultados reais.

Trabalha com "samples": cada jogo e pre-processado uma vez (fatores
normalizados 0-100, termo de confronto direto, mando de campo) para que a
avaliacao com diferentes pesos seja rapida. Suporta multiplas competicoes.
"""

import math

from . import model, ratings


def _result_class(ag, bg):
    if ag > bg:
        return 0  # vitoria do mandante (a)
    if ag == bg:
        return 1  # empate
    return 2      # vitoria do visitante (b)


def build_samples(datasets, h2h_table=None):
    """Pre-processa uma lista de datasets em uma lista plana de samples."""
    h2h_table = h2h_table or {}
    samples = []
    for ds in datasets:
        feats = ratings.make_feature_table(ds["ratings"])
        host = ds.get("host")
        for m in ds["matches"]:
            a, b = m["a"], m["b"]
            if a not in feats or b not in feats:
                continue
            samples.append({
                "fa": feats[a], "fb": feats[b],
                "h2h": model.h2h_term(a, b, h2h_table),
                "home_a": a == host, "home_b": b == host,
                "ag": m["ag"], "bg": m["bg"],
                "actual": _result_class(m["ag"], m["bg"]),
                "comp": ds.get("name", "?"),
                "label": f"{a} x {b}",
            })
    return samples


def evaluate_samples(params, samples):
    """Metricas (acuracia, log-loss, Brier) sobre uma lista de samples."""
    w = params["weights"]
    n = correct = 0
    logloss = brier = 0.0
    eps = 1e-12
    for s in samples:
        ra = model.strength(s["fa"], w)
        rb = model.strength(s["fb"], w)
        lam_a, lam_b = model.expected_goals(
            ra, rb, params, home_a=s["home_a"], home_b=s["home_b"],
            h2h_term=s["h2h"])
        pa, pd, pb, _ = model.outcome_probabilities(lam_a, lam_b)
        probs = [pa, pd, pb]
        actual = s["actual"]
        pred = max(range(3), key=lambda i: probs[i])
        if pred == actual:
            correct += 1
        logloss += -math.log(max(probs[actual], eps))
        brier += sum((probs[i] - (1.0 if i == actual else 0.0)) ** 2
                     for i in range(3))
        n += 1
    return {
        "n": n,
        "accuracy": correct / n if n else 0.0,
        "logloss": logloss / n if n else 0.0,
        "brier": brier / n if n else 0.0,
    }


def evaluate(params, dataset, h2h_table=None):
    """Compatibilidade: avalia um unico dataset."""
    return evaluate_samples(params, build_samples([dataset], h2h_table))


def by_competition(params, datasets, h2h_table=None):
    """Metricas separadas por competicao."""
    out = {}
    for ds in datasets:
        out[ds.get("name", "?")] = evaluate_samples(
            params, build_samples([ds], h2h_table))
    return out
