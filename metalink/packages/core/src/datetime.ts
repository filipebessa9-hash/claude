// Helpers de data/hora do fluxo de registro (sem dependência de Intl,
// que varia entre engines do React Native).

/**
 * Combina um deslocamento de dias no passado (0 = hoje, 1 = ontem, ...)
 * com um horário "HH:MM" no fuso local. Retorna null para horário inválido
 * ou resultado no futuro (dose não pode ser registrada adiantada).
 */
export function combineDayOffsetAndTime(
  now: Date,
  dayOffset: 0 | 1 | 2,
  timeText: string,
): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeText.trim());
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  const result = new Date(now);
  result.setDate(result.getDate() - dayOffset);
  result.setHours(hours, minutes, 0, 0);
  if (result.getTime() > now.getTime()) {
    return null;
  }
  return result;
}

/** "HH:MM" do horário local — valor inicial do campo de hora. */
export function formatTimeHHMM(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** "AAAA-MM-DD" no fuso local — formato de `daily_checkins.checkin_date`. */
export function toLocalDateString(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/** "Hoje", "Ontem" ou "dd/mm/aaaa", relativo a `now` (fuso local). */
export function formatRelativeDay(date: Date, now: Date): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / dayMs);
  if (diffDays === 0) {
    return 'Hoje';
  }
  if (diffDays === 1) {
    return 'Ontem';
  }
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}
