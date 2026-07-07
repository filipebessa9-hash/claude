// Lembretes locais (Fatia 6). Sem infra de push no MVP: tudo é notificação
// local agendada no aparelho.
//
// Seção 7: o TEXTO das notificações nunca contém dados de saúde (nome do
// medicamento, dose, peso) — aparece na tela bloqueada do aparelho.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const DOSE_REMINDER_ID = 'dose-reminder';
const WEEKLY_SUMMARY_ID = 'weekly-summary';
const SETTINGS_KEY = 'metalink.reminder-settings.v1';

export interface ReminderSettings {
  doseEnabled: boolean;
  hour: number;
  minute: number;
  weeklyEnabled: boolean;
}

export const DEFAULT_SETTINGS: ReminderSettings = {
  doseEnabled: false,
  hour: 9,
  minute: 0,
  weeklyEnabled: false,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function loadSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw
      ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as ReminderSettings) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Lembretes',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Agenda (substituindo o anterior) o lembrete one-shot da próxima dose. */
export async function scheduleDoseReminder(at: Date): Promise<void> {
  await ensureAndroidChannel();
  await Notifications.cancelScheduledNotificationAsync(DOSE_REMINDER_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: DOSE_REMINDER_ID,
    content: {
      title: 'Lembrete de aplicação',
      body: 'Sua próxima aplicação está programada para hoje. Abra para registrar.',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
  });
}

export async function cancelDoseReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DOSE_REMINDER_ID);
}

/** Digest semanal: domingo no horário indicado, recorrente. */
export async function scheduleWeeklySummary(hour: number, minute: number): Promise<void> {
  await ensureAndroidChannel();
  await Notifications.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_SUMMARY_ID,
    content: {
      title: 'Seu resumo da semana',
      body: 'Veja como foi sua semana no MetaLink.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // domingo
      hour,
      minute,
    },
  });
}

export async function cancelWeeklySummary(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_ID);
}
