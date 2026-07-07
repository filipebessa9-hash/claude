// Reagenda o lembrete da próxima dose a partir do último registro.
// Chamado após salvar uma dose e ao alterar as configurações de lembrete.

import { computeNextDoseReminder, intervalDaysForRoute } from '@metalink/core';

import { fetchMedications, fetchRecentDoses } from './doses';
import { loadSettings, scheduleDoseReminder } from './notifications';

export async function rescheduleDoseReminderIfEnabled(): Promise<Date | null> {
  const settings = await loadSettings();
  if (!settings.doseEnabled) {
    return null;
  }
  const [doses, medications] = await Promise.all([fetchRecentDoses(1), fetchMedications()]);
  const last = doses[0];
  if (!last) {
    return null;
  }
  const medication = medications.find((m) => m.id === last.medication_id);
  if (!medication) {
    return null;
  }
  const next = computeNextDoseReminder(
    new Date(last.taken_at),
    intervalDaysForRoute(medication.route),
    new Date(),
    { hour: settings.hour, minute: settings.minute },
  );
  await scheduleDoseReminder(next);
  return next;
}
