import {
  buildWeeklySummary,
  formatWeightKg,
  intervalDaysForRoute,
  type WeeklySummary,
} from '@metalink/core';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchMedications, fetchRecentDoses } from '@/lib/doses';
import { fetchRecentCheckins, fetchSymptomLogs, fetchWeightLogs } from '@/lib/health';

export default function ResumoScreen() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          setError(null);
          const [doses, medications, weights, symptoms, checkins] = await Promise.all([
            fetchRecentDoses(50),
            fetchMedications(),
            fetchWeightLogs(30),
            fetchSymptomLogs(50),
            fetchRecentCheckins(7),
          ]);
          if (cancelled) {
            return;
          }
          const lastMedication = doses[0]
            ? medications.find((m) => m.id === doses[0]!.medication_id)
            : undefined;
          setSummary(
            buildWeeklySummary({
              doseTimes: doses.map((d) => new Date(d.taken_at)),
              weightPoints: weights.map((w) => ({
                measuredAt: new Date(w.measured_at),
                weightKg: Number(w.weight_kg),
              })),
              symptoms: symptoms.map((s) => ({
                symptom: s.symptom,
                severity: s.severity,
                occurredAt: new Date(s.occurred_at),
              })),
              checkinCount: checkins.length,
              intervalDays: lastMedication ? intervalDaysForRoute(lastMedication.route) : null,
              now: new Date(),
            }),
          );
          setLoaded(true);
        } catch {
          if (!cancelled) {
            setError('Não foi possível montar seu resumo. Tente novamente.');
            setLoaded(true);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  const formatChange = (value: number) =>
    `${value > 0 ? '+' : ''}${String(value).replace('.', ',')} kg`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      {summary && (
        <>
          <Text style={styles.title}>Sua semana</Text>

          <View style={styles.card}>
            <Text style={styles.cardValue}>
              {summary.doseCount}
              {summary.expectedDoses !== null ? ` de ${summary.expectedDoses}` : ''}
            </Text>
            <Text style={styles.cardLabel}>
              {summary.doseCount === 1 ? 'dose registrada' : 'doses registradas'}
              {summary.expectedDoses !== null ? ' (esperadas pelo esquema)' : ''}
            </Text>
          </View>

          <View style={styles.card}>
            {summary.latestWeightKg !== null ? (
              <>
                <Text style={styles.cardValue}>
                  {formatWeightKg(summary.latestWeightKg)}
                  {summary.weightChangeKg !== null
                    ? `  (${formatChange(summary.weightChangeKg)})`
                    : ''}
                </Text>
                <Text style={styles.cardLabel}>
                  último peso da semana{summary.weightChangeKg !== null ? ' e variação' : ''}
                </Text>
              </>
            ) : (
              <Text style={styles.cardLabel}>Nenhum peso registrado nesta semana.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardValue}>{summary.symptomCount}</Text>
            <Text style={styles.cardLabel}>
              {summary.symptomCount === 1 ? 'sintoma relatado' : 'sintomas relatados'}
              {summary.severeSymptomCount > 0
                ? ` — ${summary.severeSymptomCount} intenso(s); vale conversar com seu médico`
                : ''}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardValue}>{summary.checkinCount}/7</Text>
            <Text style={styles.cardLabel}>dias com check-in</Text>
          </View>

          <Text style={styles.encouragement}>
            Cada registro conta — no seu ritmo. Esses dados ajudam você e seu médico a enxergar o
            caminho, sem cobrança.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/registrar-dose')}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Registrar uma dose</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600' },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    gap: 4,
    backgroundColor: '#fff',
  },
  cardValue: { fontSize: 20, fontWeight: '600', color: '#0f6e5c' },
  cardLabel: { fontSize: 14, color: '#6b7280' },
  encouragement: { fontSize: 14, color: '#374151', lineHeight: 20, marginTop: 4 },
  primaryButton: {
    backgroundColor: '#0f6e5c',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    minHeight: 48,
    marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#b91c1c' },
});
