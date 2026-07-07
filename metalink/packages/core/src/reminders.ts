// Lembretes de dose (Fatia 6): a próxima aplicação é inferida da última dose
// registrada + intervalo da via do medicamento (mesma inferência da aderência).

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReminderTime {
  hour: number;
  minute?: number;
}

/**
 * Próximo horário de lembrete estritamente no futuro: parte da última dose e
 * avança de intervalo em intervalo; se um horário preferido for dado, ajusta
 * a hora do dia (empurrando mais um intervalo se cair no passado).
 */
export function computeNextDoseReminder(
  lastDoseAt: Date,
  intervalDays: number,
  now: Date,
  time?: ReminderTime,
): Date {
  if (intervalDays <= 0) {
    throw new Error('intervalDays must be positive');
  }
  const next = new Date(lastDoseAt);
  do {
    next.setTime(next.getTime() + intervalDays * DAY_MS);
  } while (next.getTime() <= now.getTime());

  if (time) {
    next.setHours(time.hour, time.minute ?? 0, 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setTime(next.getTime() + intervalDays * DAY_MS);
    }
  }
  return next;
}
