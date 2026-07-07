import {
  buildPkCurve,
  buildSeriesChartPoints,
  estimateLevelAt,
  relativeLevelPct,
  PK_ESTIMATE_DISCLAIMER,
  type PkDose,
} from '@metalink/core';
import type { DoseLog, Medication } from '@metalink/db';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { fetchMedications, fetchRecentDoses } from '@/lib/doses';

const CHART_HEIGHT = 140;
const WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export default function NivelScreen() {
  const [doses, setDoses] = useState<DoseLog[] | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const chartWidth = width - 40;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setError(null);
          const [recentDoses, meds] = await Promise.all([
            fetchRecentDoses(200),
            fetchMedications(),
          ]);
          if (!cancelled) {
            setDoses(recentDoses);
            setMedications(meds);
          }
        } catch {
          if (!cancelled) {
            setError('Não foi possível carregar seus registros.');
            setDoses((current) => current ?? []);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const model = useMemo(() => {
    if (!doses || doses.length === 0) {
      return null;
    }
    // ASSUMPTION: estima pelo medicamento da dose mais recente; doses de
    // outros princípios ativos ficam fora da curva.
    const medication = medications.find((m) => m.id === doses[0]!.medication_id);
    if (!medication) {
      return null;
    }
    const pkDoses: PkDose[] = doses
      .filter((d) => d.medication_id === medication.id)
      .map((d) => ({ takenAt: new Date(d.taken_at), doseMg: Number(d.dose_mg) }));
    const now = new Date();
    const from = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);
    const curve = buildPkCurve(pkDoses, Number(medication.half_life_hours), {
      from,
      to: now,
      stepHours: 6,
    });
    const current = estimateLevelAt(pkDoses, Number(medication.half_life_hours), now);
    const relativePct = relativeLevelPct(curve, current);
    const chartPoints = buildSeriesChartPoints(
      curve.map((p) => ({ t: p.at, value: p.level })),
      { width: chartWidth, height: CHART_HEIGHT, padding: 10 },
    );
    return { medication, relativePct, chartPoints };
  }, [doses, medications, chartWidth]);

  if (doses === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      {model === null ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Ainda sem estimativa</Text>
          <Text style={styles.emptyText}>
            Registre suas doses para acompanhar aqui uma estimativa de como o nível do medicamento
            varia entre as aplicações.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>{model.medication.brand_name}</Text>
          {model.relativePct !== null ? (
            <Text style={styles.subtitle}>
              Nível estimado agora: ≈{model.relativePct}% do seu pico dos últimos {WINDOW_DAYS}{' '}
              dias.
            </Text>
          ) : (
            <Text style={styles.subtitle}>
              Sem doses nos últimos {WINDOW_DAYS} dias — o nível estimado está próximo de zero.
            </Text>
          )}

          {model.chartPoints.length >= 2 && (
            <View style={styles.chartCard}>
              <Svg width={chartWidth} height={CHART_HEIGHT}>
                <Polyline
                  points={model.chartPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#0f6e5c"
                  strokeWidth={2}
                />
                {model.chartPoints.length > 0 && (
                  <Circle
                    cx={model.chartPoints[model.chartPoints.length - 1]!.x}
                    cy={model.chartPoints[model.chartPoints.length - 1]!.y}
                    r={4}
                    fill="#0f6e5c"
                  />
                )}
              </Svg>
              <Text style={styles.chartCaption}>
                Últimos {WINDOW_DAYS} dias — sobe a cada dose, decai pela meia-vida.
              </Text>
            </View>
          )}
        </>
      )}

      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>{PK_ESTIMATE_DISCLAIMER}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { fontSize: 15, color: '#1a1a2e', lineHeight: 21 },
  chartCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
  },
  chartCaption: { fontSize: 12, color: '#6b7280' },
  disclaimerCard: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    padding: 12,
    marginTop: 8,
  },
  disclaimerText: { fontSize: 13, color: '#374151', lineHeight: 19 },
  empty: { alignItems: 'center', gap: 8, marginTop: 24, paddingHorizontal: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  error: { color: '#b91c1c' },
});
