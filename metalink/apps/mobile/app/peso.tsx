import {
  buildWeightChartPoints,
  formatRelativeDay,
  formatWeightKg,
  summarizeWeightTrend,
  type WeightPoint,
} from '@metalink/core';
import type { WeightLog } from '@metalink/db';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { fetchWeightLogs } from '@/lib/health';

const CHART_HEIGHT = 140;

export default function PesoScreen() {
  const [logs, setLogs] = useState<WeightLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const chartWidth = width - 40;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setError(null);
          const data = await fetchWeightLogs();
          if (!cancelled) {
            setLogs(data);
          }
        } catch {
          if (!cancelled) {
            setError('Não foi possível carregar seus pesos.');
            setLogs((current) => current ?? []);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const points: WeightPoint[] = useMemo(
    () =>
      (logs ?? []).map((log) => ({
        measuredAt: new Date(log.measured_at),
        weightKg: Number(log.weight_kg),
      })),
    [logs],
  );
  const summary = useMemo(() => summarizeWeightTrend(points, new Date()), [points]);
  const chartPoints = useMemo(
    () => buildWeightChartPoints(points, { width: chartWidth, height: CHART_HEIGHT, padding: 10 }),
    [points, chartWidth],
  );

  const formatChange = (value: number) =>
    `${value > 0 ? '+' : ''}${String(value).replace('.', ',')} kg`;

  return (
    <View style={styles.container}>
      <FlatList
        data={logs ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable
              style={styles.registerButton}
              onPress={() => router.push('/registrar-peso')}
              accessibilityRole="button"
            >
              <Text style={styles.registerButtonText}>+ Registrar peso</Text>
            </Pressable>
            {error && <Text style={styles.error}>{error}</Text>}

            {summary && (
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{formatWeightKg(summary.latestKg)}</Text>
                  <Text style={styles.summaryLabel}>Último registro</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{formatChange(summary.totalChangeKg)}</Text>
                  <Text style={styles.summaryLabel}>Desde o início</Text>
                </View>
                {summary.change30dKg !== null && (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{formatChange(summary.change30dKg)}</Text>
                    <Text style={styles.summaryLabel}>Últimos 30 dias</Text>
                  </View>
                )}
              </View>
            )}

            {chartPoints.length >= 2 && (
              <View style={styles.chartCard}>
                <Svg width={chartWidth} height={CHART_HEIGHT}>
                  <Polyline
                    points={chartPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#0f6e5c"
                    strokeWidth={2}
                  />
                  {chartPoints.map((p, index) => (
                    <Circle key={index} cx={p.x} cy={p.y} r={3} fill="#0f6e5c" />
                  ))}
                </Svg>
                <Text style={styles.chartCaption}>
                  Tendência de peso — registros mais recentes à direita
                </Text>
              </View>
            )}

            {logs !== null && logs.length > 0 && <Text style={styles.sectionTitle}>Histórico</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.logRow}>
            <Text style={styles.logWeight}>{formatWeightKg(Number(item.weight_kg))}</Text>
            <Text style={styles.logDate}>
              {formatRelativeDay(new Date(item.measured_at), new Date())}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          logs === null ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nenhum peso registrado ainda</Text>
              <Text style={styles.emptyText}>
                Registre seu peso quando fizer sentido para você — a tendência aparece aqui, sem
                metas nem cobranças.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 20, paddingBottom: 40 },
  header: { gap: 12, marginBottom: 8 },
  registerButton: {
    backgroundColor: '#0f6e5c',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    minHeight: 52,
  },
  registerButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    gap: 2,
    backgroundColor: '#fff',
  },
  summaryValue: { fontSize: 16, fontWeight: '600', color: '#0f6e5c' },
  summaryLabel: { fontSize: 12, color: '#6b7280' },
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
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#6b7280', marginTop: 8 },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logWeight: { fontSize: 16, fontWeight: '500' },
  logDate: { fontSize: 14, color: '#6b7280' },
  empty: { alignItems: 'center', gap: 8, marginTop: 24, paddingHorizontal: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  error: { color: '#b91c1c' },
});
