"""Chaveamento OFICIAL do mata-mata da Copa do Mundo 2026 (48 selecoes).

Estrutura das partidas 73-104 conforme o sorteio/regulamento da FIFA.
Os 8 melhores terceiros ocupam 8 vagas com grupos permitidos especificos;
a FIFA usa uma tabela de 495 cenarios para alocar esses terceiros. Aqui a
alocacao e feita por correspondencia (matching) que respeita exatamente as
restricoes de grupos de cada vaga -- gera um chaveamento sempre valido.
"""

# Rodada de 32 (matches 73-88). Fonte de cada lado:
#   ("1", G)  -> 1o colocado do grupo G
#   ("2", G)  -> 2o colocado do grupo G
#   ("3", None) -> melhor terceiro alocado a esta vaga (ver THIRD_SLOTS)
R32 = [
    (73, ("2", "A"), ("2", "B")),
    (74, ("1", "E"), ("3", None)),
    (75, ("1", "F"), ("2", "C")),
    (76, ("1", "C"), ("2", "F")),
    (77, ("1", "I"), ("3", None)),
    (78, ("2", "E"), ("2", "I")),
    (79, ("1", "A"), ("3", None)),
    (80, ("1", "L"), ("3", None)),
    (81, ("1", "D"), ("3", None)),
    (82, ("1", "G"), ("3", None)),
    (83, ("2", "K"), ("2", "L")),
    (84, ("1", "H"), ("2", "J")),
    (85, ("1", "B"), ("3", None)),
    (86, ("1", "J"), ("2", "H")),
    (87, ("1", "K"), ("3", None)),
    (88, ("2", "D"), ("2", "G")),
]

# Vagas de melhor-terceiro e os grupos permitidos em cada uma.
THIRD_SLOTS = {
    74: set("ABCDF"),
    77: set("CDFGH"),
    79: set("CEFHI"),
    80: set("EHIJK"),
    81: set("BEFIJ"),
    82: set("AEHIJ"),
    85: set("EFGIJ"),
    87: set("DEIJL"),
}

# Rodadas seguintes: (match_id, vencedor_de, vencedor_de)
R16 = [(89, 74, 77), (90, 73, 75), (91, 76, 78), (92, 79, 80),
       (93, 83, 84), (94, 81, 82), (95, 86, 88), (96, 85, 87)]
QF = [(97, 89, 90), (98, 93, 94), (99, 91, 92), (100, 95, 96)]
SF = [(101, 97, 98), (102, 99, 100)]
FINAL = (104, 101, 102)
THIRD_PLACE = (103, 101, 102)  # perdedores das semis

ROUND_NAMES = ["Rodada de 32", "Oitavas", "Quartas", "Semifinal", "Final"]


def assign_thirds(third_groups):
    """Aloca os grupos dos 8 melhores terceiros nas 8 vagas, respeitando as
    restricoes. Retorna {match_id: grupo}. Usa matching (algoritmo de Kuhn)."""
    slots = list(THIRD_SLOTS)
    match_slot = {}  # slot -> grupo

    def try_assign(group, seen):
        for slot in slots:
            if group in THIRD_SLOTS[slot] and slot not in seen:
                seen.add(slot)
                if slot not in match_slot or try_assign(match_slot[slot], seen):
                    match_slot[slot] = group
                    return True
        return False

    for g in third_groups:
        try_assign(g, set())
    return dict(match_slot)


def resolve_r32(ranked, best_thirds, group_of):
    """Monta os confrontos da Rodada de 32: {match_id: (timeA, timeB)}.

    ranked: {grupo: [1o, 2o, 3o, 4o]}
    best_thirds: lista dos 8 times terceiros classificados
    group_of: funcao nome -> grupo
    """
    third_by_group = {group_of(t): t for t in best_thirds}
    slot_group = assign_thirds(list(third_by_group))  # match_id -> grupo

    def side(mid, src):
        kind, g = src
        if kind == "1":
            return ranked[g][0]
        if kind == "2":
            return ranked[g][1]
        # terceiro: usa o grupo alocado a esta vaga
        grp = slot_group.get(mid)
        return third_by_group.get(grp) if grp else None

    out = {}
    for mid, a, b in R32:
        out[mid] = (side(mid, a), side(mid, b))
    return out


def play(r32_teams, decide):
    """Roda o bracket completo. `decide(a, b)` -> (vencedor, info).

    Retorna (winners, results, champion, runner_up) onde:
      winners: {match_id: time}
      results: {match_id: (a, b, vencedor, info)}
    """
    winners, results = {}, {}

    def run(mid, a, b):
        w, info = decide(a, b)
        winners[mid] = w
        results[mid] = (a, b, w, info)

    for mid, (a, b) in r32_teams.items():
        run(mid, a, b)
    for mid, sa, sb in R16:
        run(mid, winners[sa], winners[sb])
    for mid, sa, sb in QF:
        run(mid, winners[sa], winners[sb])
    for mid, sa, sb in SF:
        run(mid, winners[sa], winners[sb])
    fmid, sa, sb = FINAL
    run(fmid, winners[sa], winners[sb])

    champion = winners[fmid]
    a, b, w, _ = results[fmid]
    runner_up = b if w == a else a
    return winners, results, champion, runner_up
