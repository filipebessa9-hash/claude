"""
Modelo de predicao de partidas da Copa do Mundo 2026.

Combina os fatores pedidos (ranking FIFA, elenco, tecnico, forma recente,
qualidade tecnica/estatistica, esquema tatico e confronto direto) em um
indice de forca por selecao, e converte a diferenca de forca em gols
esperados via um modelo de Poisson bivariado (independente).

Sem dependencias externas: usa apenas a biblioteca padrao do Python.
"""

import math

# Fatores que compoem o indice de forca de uma selecao.
# 'rank' deriva dos pontos do ranking FIFA (normalizados 0-100).
FEATURES = ["rank", "squad", "coach", "form", "tactical"]


def default_params():
    """Parametros iniciais (antes da calibracao). Pesos somam 1.0."""
    return {
        "weights": {
            "rank": 0.30,      # ranking FIFA
            "squad": 0.25,     # qualidade tecnica do elenco / estatisticas
            "coach": 0.10,     # qualidade e experiencia do tecnico
            "form": 0.20,      # retrospecto dos ultimos 4 anos
            "tactical": 0.15,  # esquema tatico
        },
        "k": 0.30,             # sensibilidade da forca -> gols
        "home_adv": 0.25,      # vantagem de jogar como mandante (pais-sede)
        "h2h_weight": 0.10,    # peso do confronto direto historico
        "avg_goals": 1.35,     # media de gols por equipe por jogo
    }


def normalize_points(points_by_team):
    """Converte pontos do ranking FIFA em um indice 0-100 (min-max)."""
    vals = list(points_by_team.values())
    lo, hi = min(vals), max(vals)
    spread = (hi - lo) or 1.0
    return {t: 100.0 * (p - lo) / spread for t, p in points_by_team.items()}


def strength(features, weights):
    """Indice de forca composto (0-100) de uma selecao."""
    return sum(weights[f] * features[f] for f in FEATURES)


def _poisson_pmf(lmbda, k):
    return math.exp(-lmbda) * (lmbda ** k) / math.factorial(k)


def expected_goals(rating_a, rating_b, params,
                   home_a=False, home_b=False, h2h_term=0.0):
    """Gols esperados (lambda) para cada lado, dado o indice de forca."""
    k = params["k"]
    avg = params["avg_goals"]
    home = params["home_adv"]
    diff = (rating_a - rating_b) / 10.0
    exp_a = k * diff + (home if home_a else 0.0) + params["h2h_weight"] * h2h_term
    exp_b = -k * diff + (home if home_b else 0.0) - params["h2h_weight"] * h2h_term
    lam_a = avg * math.exp(exp_a)
    lam_b = avg * math.exp(exp_b)
    # Limita para evitar valores irreais.
    return min(lam_a, 6.0), min(lam_b, 6.0)


def outcome_probabilities(lam_a, lam_b, max_goals=8):
    """Probabilidades de vitoria/empate/derrota e placar mais provavel.

    Retorna (p_a, p_draw, p_b, (gols_a, gols_b)).
    """
    pa = pdraw = pb = 0.0
    best_p, best_score = -1.0, (0, 0)
    pmf_a = [_poisson_pmf(lam_a, i) for i in range(max_goals + 1)]
    pmf_b = [_poisson_pmf(lam_b, j) for j in range(max_goals + 1)]
    for i in range(max_goals + 1):
        for j in range(max_goals + 1):
            p = pmf_a[i] * pmf_b[j]
            if p > best_p:
                best_p, best_score = p, (i, j)
            if i > j:
                pa += p
            elif i == j:
                pdraw += p
            else:
                pb += p
    total = pa + pdraw + pb
    return pa / total, pdraw / total, pb / total, best_score


def h2h_term(team_a, team_b, h2h_table):
    """Termo de confronto direto em [-1, 1] (positivo favorece team_a)."""
    rec = h2h_table.get((team_a, team_b))
    sign = 1.0
    if rec is None:
        rec = h2h_table.get((team_b, team_a))
        sign = -1.0
    if rec is None:
        return 0.0
    a_w, d, b_w = rec["a_wins"], rec["draws"], rec["b_wins"]
    total = a_w + d + b_w
    if total == 0:
        return 0.0
    a_score = (a_w + 0.5 * d) / total
    return sign * (2.0 * a_score - 1.0)
