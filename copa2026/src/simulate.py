"""Simulacao do torneio: fase de grupos + mata-mata (Monte Carlo).

Formato 2026: 12 grupos de 4. Avancam os 2 primeiros de cada grupo + os
8 melhores terceiros colocados (32 selecoes), seguindo para o mata-mata.

O chaveamento oficial do mata-mata e complexo; aqui usamos um chaveamento
por forca (reseeding a cada rodada: o mais forte enfrenta o mais fraco
entre os classificados). E uma aproximacao, documentada no README.
"""

import math
import random

from . import knockout, model, ratings


def _poisson_sample(lmbda, rng):
    """Amostra de uma Poisson (algoritmo de Knuth)."""
    L = math.exp(-lmbda)
    k, p = 0, 1.0
    while True:
        k += 1
        p *= rng.random()
        if p <= L:
            return k - 1


class Tournament:
    def __init__(self, teams, params, h2h_table, seed=0):
        self.teams = teams
        self.params = params
        self.h2h = h2h_table
        self.rng = random.Random(seed)
        feats = ratings.make_feature_table(ratings.raw_from_teams(teams))
        self.strength = ratings.strengths(feats, params["weights"])

    # ---- partidas -------------------------------------------------------
    def _lambdas(self, a, b):
        term = model.h2h_term(a, b, self.h2h)
        return model.expected_goals(
            self.strength[a], self.strength[b], self.params,
            home_a=self.teams[a]["host"], home_b=self.teams[b]["host"],
            h2h_term=term)

    def play(self, a, b):
        """Simula um placar de jogo (fase de grupos)."""
        lam_a, lam_b = self._lambdas(a, b)
        return _poisson_sample(lam_a, self.rng), _poisson_sample(lam_b, self.rng)

    def knockout_winner(self, a, b):
        """Vencedor de um confronto eliminatorio (decide empate nos penaltis)."""
        ga, gb = self.play(a, b)
        if ga > gb:
            return a
        if gb > ga:
            return b
        # Penaltis: leve vantagem para o mais forte.
        diff = (self.strength[a] - self.strength[b]) / 100.0
        p_a = min(0.85, max(0.15, 0.5 + 0.5 * diff))
        return a if self.rng.random() < p_a else b

    def decide_random(self, a, b):
        """Callback de mata-mata para Monte Carlo (sorteia o vencedor)."""
        return self.knockout_winner(a, b), None

    def decide_ml(self, a, b):
        """Callback deterministico: escolhe o lado mais provavel de avancar."""
        lam_a, lam_b = self._lambdas(a, b)
        pa, pd, pb, score = model.outcome_probabilities(lam_a, lam_b)
        tb = min(0.85, max(0.15, 0.5 + 0.5 * (self.strength[a] - self.strength[b]) / 100.0))
        p_a_adv = pa + pd * tb
        p_b_adv = pb + pd * (1 - tb)
        winner = a if p_a_adv >= p_b_adv else b
        info = {"p_winner": max(p_a_adv, p_b_adv), "score": score,
                "pa": pa, "pd": pd, "pb": pb, "p_a_adv": p_a_adv}
        return winner, info

    # ---- fases ----------------------------------------------------------
    def group_stage(self, groups):
        """Simula a fase de grupos.

        Retorna dict com: 'qualifiers' (32 times), 'ranked' (ordem por grupo),
        'best_thirds' (8 melhores terceiros)."""
        firsts_seconds = []
        thirds = []
        ranked_by_group = {}
        for g, members in groups.items():
            table = {t: {"pts": 0, "gd": 0, "gf": 0} for t in members}
            for i in range(len(members)):
                for j in range(i + 1, len(members)):
                    a, b = members[i], members[j]
                    ga, gb = self.play(a, b)
                    table[a]["gf"] += ga
                    table[b]["gf"] += gb
                    table[a]["gd"] += ga - gb
                    table[b]["gd"] += gb - ga
                    if ga > gb:
                        table[a]["pts"] += 3
                    elif gb > ga:
                        table[b]["pts"] += 3
                    else:
                        table[a]["pts"] += 1
                        table[b]["pts"] += 1
            ranked = sorted(
                members,
                key=lambda t: (table[t]["pts"], table[t]["gd"],
                               table[t]["gf"], self.strength[t]),
                reverse=True)
            ranked_by_group[g] = ranked
            firsts_seconds.extend([ranked[0], ranked[1]])
            thirds.append((ranked[2], table[ranked[2]]))
        # 8 melhores terceiros
        thirds.sort(key=lambda x: (x[1]["pts"], x[1]["gd"], x[1]["gf"],
                                   self.strength[x[0]]), reverse=True)
        best_thirds = [t for t, _ in thirds[:8]]
        return {
            "qualifiers": firsts_seconds + best_thirds,
            "ranked": ranked_by_group,
            "best_thirds": best_thirds,
        }

    def knockout(self, qualifiers):
        """Mata-mata com reseeding por forca. Retorna (campeao, vice, semis)."""
        alive = sorted(qualifiers, key=lambda t: self.strength[t], reverse=True)
        semifinalists = []
        runner_up = None
        while len(alive) > 1:
            ranked = sorted(alive, key=lambda t: self.strength[t], reverse=True)
            n = len(ranked)
            winners = []
            for i in range(n // 2):
                a, b = ranked[i], ranked[n - 1 - i]
                winners.append(self.knockout_winner(a, b))
            if len(alive) == 4:
                semifinalists = list(alive)
            if len(alive) == 2:
                runner_up = [t for t in alive if t not in winners][0]
            alive = winners
        return alive[0], runner_up, semifinalists


def expected_group_table(teams, params, h2h_table, groups):
    """Tabela deterministica de pontos esperados por grupo (sem aleatoriedade)."""
    feats = ratings.make_feature_table(ratings.raw_from_teams(teams))
    strength = ratings.strengths(feats, params["weights"])
    result = {}
    for g, members in groups.items():
        exp_pts = {t: 0.0 for t in members}
        for i in range(len(members)):
            for j in range(i + 1, len(members)):
                a, b = members[i], members[j]
                term = model.h2h_term(a, b, h2h_table)
                lam_a, lam_b = model.expected_goals(
                    strength[a], strength[b], params,
                    home_a=teams[a]["host"], home_b=teams[b]["host"],
                    h2h_term=term)
                pa, pd, pb, _ = model.outcome_probabilities(lam_a, lam_b)
                exp_pts[a] += 3 * pa + pd
                exp_pts[b] += 3 * pb + pd
        ranked = sorted(members, key=lambda t: exp_pts[t], reverse=True)
        result[g] = [(t, round(exp_pts[t], 2)) for t in ranked]
    return result


def group_match_predictions(teams, params, h2h_table, groups):
    """Previsao deterministica de cada jogo da fase de grupos.

    Retorna {grupo: [ {a, b, pa, pd, pb, score} ]}."""
    feats = ratings.make_feature_table(ratings.raw_from_teams(teams))
    strength = ratings.strengths(feats, params["weights"])
    out = {}
    for g, members in groups.items():
        jogos = []
        for i in range(len(members)):
            for j in range(i + 1, len(members)):
                a, b = members[i], members[j]
                term = model.h2h_term(a, b, h2h_table)
                lam_a, lam_b = model.expected_goals(
                    strength[a], strength[b], params,
                    home_a=teams[a]["host"], home_b=teams[b]["host"],
                    h2h_term=term)
                pa, pd, pb, score = model.outcome_probabilities(lam_a, lam_b)
                jogos.append({"a": a, "b": b, "pa": pa, "pd": pd, "pb": pb,
                              "score": score})
        out[g] = jogos
    return out


def _deterministic_qualifiers(teams, params, h2h_table, groups):
    """Classificacao projetada (deterministica): ranked por grupo + 8 terceiros."""
    tbl = expected_group_table(teams, params, h2h_table, groups)
    ranked = {g: [t for t, _ in tbl[g]] for g in tbl}
    thirds = sorted(((g, tbl[g][2][0], tbl[g][2][1]) for g in tbl),
                    key=lambda x: x[2], reverse=True)
    best_thirds = [t for _, t, _ in thirds[:8]]
    return ranked, best_thirds


def deterministic_bracket(teams, params, h2h_table, groups):
    """Bracket OFICIAL preenchido com o cenario mais provavel de cada jogo.

    Retorna (results, champion, runner_up, r32_teams)."""
    tour = Tournament(teams, params, h2h_table)
    ranked, best_thirds = _deterministic_qualifiers(teams, params, h2h_table, groups)
    group_of = lambda t: teams[t]["group"]  # noqa: E731
    r32 = knockout.resolve_r32(ranked, best_thirds, group_of)
    _, results, champ, runner = knockout.play(r32, tour.decide_ml)
    return results, champ, runner, r32


def monte_carlo_bracket(teams, params, h2h_table, groups, n_sims=20000, seed=11):
    """Monte Carlo pelo chaveamento OFICIAL. Probabilidades por rodada."""
    reach = {r: {} for r in ["r16", "qf", "sf", "final", "champion"]}
    group_of = lambda t: teams[t]["group"]  # noqa: E731
    base = random.Random(seed)
    for _ in range(n_sims):
        tour = Tournament(teams, params, h2h_table, seed=base.randrange(1 << 30))
        gs = tour.group_stage(groups)
        r32 = knockout.resolve_r32(gs["ranked"], gs["best_thirds"], group_of)
        winners, _, champ, _ = knockout.play(r32, tour.decide_random)

        for mid in (m[0] for m in knockout.R32):
            t = winners[mid]
            reach["r16"][t] = reach["r16"].get(t, 0) + 1
        for mid, _, _ in knockout.R16:
            t = winners[mid]
            reach["qf"][t] = reach["qf"].get(t, 0) + 1
        for mid, _, _ in knockout.QF:
            t = winners[mid]
            reach["sf"][t] = reach["sf"].get(t, 0) + 1
        for mid, _, _ in knockout.SF:
            t = winners[mid]
            reach["final"][t] = reach["final"].get(t, 0) + 1
        reach["champion"][champ] = reach["champion"].get(champ, 0) + 1

    def pct(d):
        return {t: 100.0 * c / n_sims for t, c in d.items()}

    return {r: pct(reach[r]) for r in reach}


def monte_carlo(teams, params, h2h_table, groups, n_sims=20000, seed=7):
    """Roda N simulacoes e agrega probabilidades de titulo/final/semi/avanco."""
    champ = {}
    final = {}
    semi = {}
    advance = {}
    win_group = {}
    second = {}
    base = random.Random(seed)
    for s in range(n_sims):
        tour = Tournament(teams, params, h2h_table, seed=base.randrange(1 << 30))
        gs = tour.group_stage(groups)
        qualifiers = gs["qualifiers"]
        for t in qualifiers:
            advance[t] = advance.get(t, 0) + 1
        for g, ranked in gs["ranked"].items():
            win_group[ranked[0]] = win_group.get(ranked[0], 0) + 1
            second[ranked[1]] = second.get(ranked[1], 0) + 1
        winner, runner, semis = tour.knockout(qualifiers)
        champ[winner] = champ.get(winner, 0) + 1
        if runner:
            final[runner] = final.get(runner, 0) + 1
            final[winner] = final.get(winner, 0) + 1
        for t in semis:
            semi[t] = semi.get(t, 0) + 1

    def pct(d):
        return {t: 100.0 * c / n_sims for t, c in d.items()}

    return {
        "n_sims": n_sims,
        "champion": pct(champ),
        "final": pct(final),
        "semifinal": pct(semi),
        "advance": pct(advance),
        "win_group": pct(win_group),
        "second": pct(second),
    }
