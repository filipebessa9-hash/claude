import {
  combineDayOffsetAndTime,
  formatTimeHHMM,
  isValidWeightKg,
  parseWeightInput,
} from '@metalink/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { insertWeight } from '@/lib/health';

type DayOffset = 0 | 1 | 2;
const DAY_OPTIONS: { offset: DayOffset; label: string }[] = [
  { offset: 0, label: 'Hoje' },
  { offset: 1, label: 'Ontem' },
  { offset: 2, label: 'Anteontem' },
];

export default function RegistrarPesoScreen() {
  const [weightText, setWeightText] = useState('');
  const [dayOffset, setDayOffset] = useState<DayOffset>(0);
  const [timeText, setTimeText] = useState(formatTimeHHMM(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    const weightKg = parseWeightInput(weightText);
    if (weightKg === null || !isValidWeightKg(weightKg)) {
      setError('Informe um peso válido em kg (ex.: 82,5).');
      return;
    }
    const measuredAt = combineDayOffsetAndTime(new Date(), dayOffset, timeText);
    if (!measuredAt) {
      setError('Horário inválido — use o formato HH:MM e um horário que já passou.');
      return;
    }
    setSaving(true);
    try {
      await insertWeight(weightKg, measuredAt);
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>Peso (kg)</Text>
      <TextInput
        style={styles.input}
        value={weightText}
        onChangeText={setWeightText}
        keyboardType="decimal-pad"
        placeholder="Ex.: 82,5"
        accessibilityLabel="Peso em quilogramas"
        autoFocus
      />

      <Text style={styles.sectionTitle}>Quando</Text>
      <View style={styles.chipRow}>
        {DAY_OPTIONS.map(({ offset, label }) => (
          <Chip
            key={offset}
            label={label}
            selected={dayOffset === offset}
            onPress={() => setDayOffset(offset)}
          />
        ))}
        <TextInput
          style={[styles.input, styles.timeInput]}
          value={timeText}
          onChangeText={setTimeText}
          keyboardType="numbers-and-punctuation"
          placeholder="HH:MM"
          accessibilityLabel="Horário da pesagem"
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
      >
        <Text style={styles.saveButtonText}>{saving ? 'Salvando…' : 'Salvar peso'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 4,
  },
  timeInput: { width: 90, marginTop: 0 },
  error: { color: '#b91c1c', marginTop: 8 },
  saveButton: {
    backgroundColor: '#0f6e5c',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 52,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
