import { formatRelativeDay, formatTimeHHMM } from '@metalink/core';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Chip } from '@/components/Chip';
import {
  cancelDoseReminder,
  cancelWeeklySummary,
  ensurePermission,
  loadSettings,
  saveSettings,
  scheduleWeeklySummary,
  type ReminderSettings,
} from '@/lib/notifications';
import { rescheduleDoseReminderIfEnabled } from '@/lib/reminder-sync';

const HOUR_OPTIONS = [
  { hour: 8, label: 'Manhã (8h)' },
  { hour: 14, label: 'Tarde (14h)' },
  { hour: 20, label: 'Noite (20h)' },
];

export default function LembretesScreen() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [nextReminder, setNextReminder] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const loaded = await loadSettings();
      setSettings(loaded);
      if (loaded.doseEnabled) {
        setNextReminder(await rescheduleDoseReminderIfEnabled());
      }
    })();
  }, []);

  async function update(next: ReminderSettings) {
    setError(null);
    setSettings(next);
    await saveSettings(next);

    if (next.doseEnabled || next.weeklyEnabled) {
      const granted = await ensurePermission();
      if (!granted) {
        setError('Permita notificações nas configurações do aparelho para receber lembretes.');
        const reverted = { ...next, doseEnabled: false, weeklyEnabled: false };
        setSettings(reverted);
        await saveSettings(reverted);
        return;
      }
    }

    if (next.doseEnabled) {
      const scheduled = await rescheduleDoseReminderIfEnabled();
      setNextReminder(scheduled);
      if (!scheduled) {
        setError(
          'Registre uma dose primeiro — o lembrete é calculado a partir da última aplicação.',
        );
      }
    } else {
      await cancelDoseReminder();
      setNextReminder(null);
    }

    if (next.weeklyEnabled) {
      await scheduleWeeklySummary(18, 0);
    } else {
      await cancelWeeklySummary();
    }
  }

  if (!settings) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.rowBetween}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Lembrete de dose</Text>
          <Text style={styles.hint}>
            Calculado a partir da sua última aplicação e do esquema do medicamento.
          </Text>
        </View>
        <Switch
          value={settings.doseEnabled}
          onValueChange={(value) => void update({ ...settings, doseEnabled: value })}
          accessibilityLabel="Ativar lembrete de dose"
        />
      </View>

      {settings.doseEnabled && (
        <>
          <Text style={styles.sectionTitle}>Horário do lembrete</Text>
          <View style={styles.chipRow}>
            {HOUR_OPTIONS.map(({ hour, label }) => (
              <Chip
                key={hour}
                label={label}
                selected={settings.hour === hour}
                onPress={() => void update({ ...settings, hour, minute: 0 })}
              />
            ))}
          </View>
          {nextReminder && (
            <Text style={styles.nextInfo}>
              Próximo lembrete: {formatRelativeDay(nextReminder, new Date())} às{' '}
              {formatTimeHHMM(nextReminder)}.
            </Text>
          )}
        </>
      )}

      <View style={styles.rowBetween}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Resumo semanal</Text>
          <Text style={styles.hint}>Um aviso aos domingos à noite com o seu resumo da semana.</Text>
        </View>
        <Switch
          value={settings.weeklyEnabled}
          onValueChange={(value) => void update({ ...settings, weeklyEnabled: value })}
          accessibilityLabel="Ativar resumo semanal"
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.privacyNote}>
        As notificações não mostram medicamento, dose nem qualquer dado de saúde — apenas um
        lembrete para abrir o app.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 16 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nextInfo: { fontSize: 14, color: '#0f6e5c', fontWeight: '500' },
  privacyNote: { fontSize: 12, color: '#6b7280', lineHeight: 17, marginTop: 8 },
  error: { color: '#b91c1c' },
});
