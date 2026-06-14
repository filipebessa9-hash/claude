"""Construcao dos vetores de fatores e do indice de forca por selecao."""

from . import model


def make_feature_table(raw):
    """Recebe {team: {points, squad, coach, form, tactical}} e devolve a
    tabela de fatores 0-100 (com 'rank' derivado dos pontos do ranking FIFA)."""
    points = {t: v["points"] for t, v in raw.items()}
    rank_score = model.normalize_points(points)
    table = {}
    for t, v in raw.items():
        table[t] = {
            "rank": rank_score[t],
            "squad": v["squad"],
            "coach": v["coach"],
            "form": v["form"],
            "tactical": v["tactical"],
        }
    return table


def raw_from_teams(teams):
    """Extrai os campos brutos da base 2026."""
    return {
        name: {
            "points": t["points"],
            "squad": t["squad"],
            "coach": t["coach"],
            "form": t["form"],
            "tactical": t["tactical"],
        }
        for name, t in teams.items()
    }


def strengths(feature_table, weights):
    """Indice de forca composto por selecao."""
    return {t: model.strength(f, weights) for t, f in feature_table.items()}
