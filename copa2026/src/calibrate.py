"""Calibracao automatica: ajusta os pesos e parametros para melhorar a
predicao no conjunto de validacao (Copa 2022 + Euro 2024 + Copa America 2024).

Correcoes contra overfitting:
  - piso minimo por fator (nenhum fator pode dominar sozinho);
  - regularizacao L2 que puxa os pesos para o prior teorico;
  - validacao cruzada k-fold para estimar a acuracia em jogos NAO vistos.

Opera sobre "samples" pre-processados (ver backtest.build_samples).
So usa a biblioteca padrao.
"""

import copy
import random

from . import backtest, model

WEIGHT_FLOOR = 0.05   # peso minimo de cada fator
REG_LAMBDA = 0.20     # forca da regularizacao para o prior


def _prior_weights():
    return model.default_params()["weights"]


def _normalize_floor(w):
    w = {k: max(WEIGHT_FLOOR, v) for k, v in w.items()}
    s = sum(w.values())
    return {k: v / s for k, v in w.items()}


def _random_weights(rng):
    raw = {f: rng.random() for f in model.FEATURES}
    s = sum(raw.values())
    return _normalize_floor({f: v / s for f, v in raw.items()})


def _random_params(rng):
    return {
        "weights": _random_weights(rng),
        "k": rng.uniform(0.12, 0.55),
        "home_adv": rng.uniform(0.0, 0.45),
        "h2h_weight": rng.uniform(0.0, 0.30),
        "avg_goals": rng.uniform(1.2, 1.5),
    }


def _reg_penalty(weights, prior):
    return REG_LAMBDA * sum((weights[f] - prior[f]) ** 2 for f in model.FEATURES)


def _objective(params, samples, prior):
    """Funcao objetivo regularizada (menor=melhor). Acuracia desempata."""
    m = backtest.evaluate_samples(params, samples)
    obj = m["logloss"] + _reg_penalty(params["weights"], prior)
    return (obj, -m["accuracy"]), m


def _refine(params, samples, prior, rng, rounds=800, step=0.05):
    best = copy.deepcopy(params)
    best_key, _ = _objective(best, samples, prior)
    for _ in range(rounds):
        cand = copy.deepcopy(best)
        f = rng.choice(model.FEATURES)
        cand["weights"][f] = cand["weights"][f] + rng.uniform(-step, step)
        cand["weights"] = _normalize_floor(cand["weights"])
        cand["k"] = min(0.6, max(0.1, cand["k"] + rng.uniform(-step, step)))
        cand["home_adv"] = min(0.5, max(0.0, cand["home_adv"] + rng.uniform(-step, step)))
        cand["h2h_weight"] = min(0.35, max(0.0, cand["h2h_weight"] + rng.uniform(-step, step)))
        key, _ = _objective(cand, samples, prior)
        if key < best_key:
            best, best_key = cand, key
    return best


def _search(samples, rng, n_iter, prior):
    best = model.default_params()
    best_key, _ = _objective(best, samples, prior)
    for _ in range(n_iter):
        cand = _random_params(rng)
        key, _ = _objective(cand, samples, prior)
        if key < best_key:
            best, best_key = cand, key
    return _refine(best, samples, prior, rng)


def cross_validate(samples, n_iter=1200, k=5, seed=123):
    """k-fold: calibra no treino, mede no teste (jogos nao vistos)."""
    rng = random.Random(seed)
    samples = list(samples)
    rng.shuffle(samples)
    prior = _prior_weights()
    folds = [samples[i::k] for i in range(k)]

    acc = ll = br = 0.0
    n = 0
    for i in range(k):
        test = folds[i]
        train = [s for j in range(k) if j != i for s in folds[j]]
        params = _search(train, random.Random(seed + i), n_iter, prior)
        mt = backtest.evaluate_samples(params, test)
        acc += mt["accuracy"] * mt["n"]
        ll += mt["logloss"] * mt["n"]
        br += mt["brier"] * mt["n"]
        n += mt["n"]
    return {"n": n, "accuracy": acc / n, "logloss": ll / n, "brier": br / n}


def calibrate(samples, n_iter=4000, seed=42, verbose=True):
    """Calibracao final (conjunto completo) + baseline."""
    rng = random.Random(seed)
    prior = _prior_weights()

    baseline_params = model.default_params()
    baseline_metrics = backtest.evaluate_samples(baseline_params, samples)

    best_params = _search(samples, rng, n_iter, prior)
    best_metrics = backtest.evaluate_samples(best_params, samples)

    if verbose:
        print("  Busca concluida: {} candidatos avaliados + refino local."
              .format(n_iter))

    return {
        "baseline_params": baseline_params,
        "baseline_metrics": baseline_metrics,
        "best_params": best_params,
        "best_metrics": best_metrics,
    }
