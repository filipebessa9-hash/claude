"""Carregamento das bases de dados (selecoes, confrontos diretos, backtest)."""

import json
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


def load_teams(path=None):
    path = path or os.path.join(DATA_DIR, "teams_2026.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    teams = {}
    for t in data["teams"]:
        teams[t["name"]] = t
    return teams


def load_h2h(path=None):
    """Retorna dict {(team_a, team_b): registro}."""
    path = path or os.path.join(DATA_DIR, "head_to_head.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    table = {}
    for c in data["confrontos"]:
        table[(c["team_a"], c["team_b"])] = c
    return table


def load_backtest(path=None):
    path = path or os.path.join(DATA_DIR, "backtest_wc2022.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def groups_from_teams(teams):
    """Agrupa as selecoes por grupo (A-L)."""
    groups = {}
    for name, t in teams.items():
        groups.setdefault(t["group"], []).append(name)
    return dict(sorted(groups.items()))
