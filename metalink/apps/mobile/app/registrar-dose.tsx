import {
  buildDosePrefill,
  combineDayOffsetAndTime,
  doseOptionsFromTitration,
  formatDoseMg,
  formatTimeHHMM,
  injectionSiteLabels,
  isValidDoseMg,
  parseDoseInput,
  INJECTION_SITES,
  type InjectionSite,
} from '@metalink/core';
import type { DoseLog, Medication } from '@metalink/db';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { fetchMedications, fetchRecentDoses, insertDose } from '@/lib/doses';

type DayOffset = 0 | 1 | 2;
const DAY_OPTIONS: { offset: DayOffset; label: string }[] = [
  { offset: 0, label: 'Hoje' },
  { offset: 1, label: 'Ontem' },
  { offset: 2, label: 'Anteontem' },
];

export default function RegistrarDoseScreen() {
  const [medications, setMedications] = useState<Medication[] | null>(null);
  const [lastDose, setLastDose] = useState<DoseLog | null>(null);

  const [medicationId, setMedicationId] = useState<string | null>(null);
  const [doseText, setDoseText] = useState('');
  const [site, setSite] = useState<InjectionSite | null>(null);
  const [suggestedSite, setSuggestedSite] = useState<InjectionSite | null>(null);
  const [dayOffset, setDayOffset] = useState<DayOffset>(0);
  const [timeText, setTimeText] = useState(formatTimeHHMM(new Date()));
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meds, doses] = await Promise.all([fetchMedications(), fetchRecentDoses(1)]);
        if (cancelled) {
          return;
        }
        const last = doses[0] ?? null;
        setMedications(meds);
        setLastDose(last);
        const prefill = buildDosePrefill(
          last
            ? {
                medicationId: last.medication_id,
                doseMg: last.dose_mg,
                injectionSite: last.injection_site,
              }
            : null,
        );
        setMedicationId(prefill.medicationId);
        setDoseText(prefill.doseMg !== null ? String(prefill.doseMg).replace('.', ',') : '');
        setSite(prefill.suggestedSite);
        setSuggestedSite(prefill.suggestedSite);
      } catch {
        if (!cancelled) {
          setError('Não foi possível carregar os dados. Verifique sua conexão.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedMedication = useMemo(
    () => medications?.find((m) => m.id === medicationId) ?? null,
    [medications, medicationId],
  );
  const doseOptions = useMemo(
    () =>
      selectedMedication ? doseOptionsFromTitration(selectedMedication.typical_titration) : [],
    [selectedMedication],
  );

  async function handleSave() {
    setError(null);
    if (!medicationId) {
      setError('Escolha o medicamento.');
      return;
    }
    const doseMg = parseDoseInput(doseText);
    if (doseMg === null || !isValidDoseMg(doseMg)) {
      setError('Informe uma dose válida em mg (ex.: 0,5).');
      return;
    }
    const takenAt = combineDayOffsetAndTime(new Date(), dayOffset, timeText);
    if (!takenAt) {
      setError('Horário inválido — use o formato HH:MM e um horário que já passou.');
      return;
    }
    setSaving(true);
    try {
      await insertDose({
        medicationId,
        doseMg,
        takenAt,
        injectionSite: site,
        notes: notes.trim() === '' ? null : notes.trim(),
      });
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  if (!medications) {
    return (
      <View style={styles.loading}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator />}
      </View>
    );
  }

  const isRepeatUser = lastDose !== null;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {isRepeatUser && (
        <Text style={styles.hint}>Pré-preenchido com sua última aplicação — confira e salve.</Text>
      )}

      <Text style={styles.sectionTitle}>Medicamento</Text>
      <View style={styles.chipRow}>
        {medications.map((med) => (
          <Pressable
            key={med.id}
            style={[styles.chip, medicationId === med.id && styles.chipSelected]}
            onPress={() => setMedicationId(med.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: medicationId === med.id }}
          >
            <Text style={[styles.chipText, medicationId === med.id && styles.chipTextSelected]}>
              {med.brand_name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Dose (mg)</Text>
      {doseOptions.length > 0 && (
        <View style={styles.chipRow}>
          {doseOptions.map((option) => (
            <Pressable
              key={option}
              style={[styles.chip, parseDoseInput(doseText) === option && styles.chipSelected]}
              onPress={() => setDoseText(String(option).replace('.', ','))}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.chipText,
                  parseDoseInput(doseText) === option && styles.chipTextSelected,
                ]}
              >
                {formatDoseMg(option)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <TextInput
        style={styles.input}
        value={doseText}
        onChangeText={setDoseText}
        keyboardType="decimal-pad"
        placeholder="Ex.: 0,5"
        accessibilityLabel="Dose em miligramas"
      />

      <Text style={styles.sectionTitle}>Local da aplicação</Text>
      <View style={styles.chipRow}>
        {INJECTION_SITES.map((option) => (
          <Pressable
            key={option}
            style={[styles.chip, site === option && styles.chipSelected]}
            onPress={() => setSite(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: site === option }}
          >
            <Text style={[styles.chipText, site === option && styles.chipTextSelected]}>
              {injectionSiteLabels[option]}
              {option === suggestedSite ? ' ★' : ''}
            </Text>
          </Pressable>
        ))}
      </View>
      {suggestedSite && (
        <Text style={styles.hint}>★ = próximo local sugerido pela rotação de aplicação.</Text>
      )}

      <Text style={styles.sectionTitle}>Quando</Text>
      <View style={styles.chipRow}>
        {DAY_OPTIONS.map(({ offset, label }) => (
          <Pressable
            key={offset}
            style={[styles.chip, dayOffset === offset && styles.chipSelected]}
            onPress={() => setDayOffset(offset)}
            accessibilityRole="button"
            accessibilityState={{ selected: dayOffset === offset }}
          >
            <Text style={[styles.chipText, dayOffset === offset && styles.chipTextSelected]}>
              {label}
            </Text>
          </Pressable>
        ))}
        <TextInput
          style={[styles.input, styles.timeInput]}
          value={timeText}
          onChangeText={setTimeText}
          keyboardType="numbers-and-punctuation"
          placeholder="HH:MM"
          accessibilityLabel="Horário da aplicação"
        />
      </View>

      <Text style={styles.sectionTitle}>Observações (opcional)</Text>
      <TextInput
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
        placeholder="Algo que queira lembrar ou contar ao seu médico"
        accessibilityLabel="Observações"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
      >
        <Text style={styles.saveButtonText}>{saving ? 'Salvando…' : 'Salvar dose'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: '#0f6e5c', borderColor: '#0f6e5c' },
  chipText: { fontSize: 15, color: '#1a1a2e' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
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
