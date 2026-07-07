import {
  combineDayOffsetAndTime,
  formatTimeHHMM,
  symptomSeverityLabels,
  symptomTypeLabels,
  SYMPTOM_SEVERITIES,
  SYMPTOM_TYPES,
  type SymptomSeverity,
  type SymptomType,
} from '@metalink/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { insertSymptom } from '@/lib/health';

type DayOffset = 0 | 1 | 2;
const DAY_OPTIONS: { offset: DayOffset; label: string }[] = [
  { offset: 0, label: 'Hoje' },
  { offset: 1, label: 'Ontem' },
  { offset: 2, label: 'Anteontem' },
];

export default function RegistrarSintomaScreen() {
  const [symptom, setSymptom] = useState<SymptomType | null>(null);
  const [severity, setSeverity] = useState<SymptomSeverity | null>(null);
  const [dayOffset, setDayOffset] = useState<DayOffset>(0);
  const [timeText, setTimeText] = useState(formatTimeHHMM(new Date()));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    if (!symptom) {
      setError('Escolha o sintoma.');
      return;
    }
    if (!severity) {
      setError('Indique a intensidade.');
      return;
    }
    const occurredAt = combineDayOffsetAndTime(new Date(), dayOffset, timeText);
    if (!occurredAt) {
      setError('Horário inválido — use o formato HH:MM e um horário que já passou.');
      return;
    }
    setSaving(true);
    try {
      await insertSymptom({
        symptom,
        severity,
        occurredAt,
        notes: notes.trim() === '' ? null : notes.trim(),
      });
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.hint}>
        Registrar como você se sente ajuda seu médico a acompanhar o tratamento. Isto não é uma
        avaliação médica.
      </Text>

      <Text style={styles.sectionTitle}>O que você sentiu?</Text>
      <View style={styles.chipRow}>
        {SYMPTOM_TYPES.map((option) => (
          <Chip
            key={option}
            label={symptomTypeLabels[option]}
            selected={symptom === option}
            onPress={() => setSymptom(option)}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Intensidade</Text>
      <View style={styles.chipRow}>
        {SYMPTOM_SEVERITIES.map((option) => (
          <Chip
            key={option}
            label={symptomSeverityLabels[option]}
            selected={severity === option}
            onPress={() => setSeverity(option)}
          />
        ))}
      </View>

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
          accessibilityLabel="Horário do sintoma"
        />
      </View>

      <Text style={styles.sectionTitle}>Observações (opcional)</Text>
      <TextInput
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
        placeholder="Detalhes que queira contar ao seu médico"
        accessibilityLabel="Observações"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
      >
        <Text style={styles.saveButtonText}>{saving ? 'Salvando…' : 'Salvar sintoma'}</Text>
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
  hint: { fontSize: 13, color: '#6b7280' },
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
