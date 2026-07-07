import {
  formatRelativeDay,
  formatTimeHHMM,
  symptomSeverityLabels,
  symptomTypeLabels,
} from '@metalink/core';
import type { SymptomLog } from '@metalink/db';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { fetchSymptomLogs } from '@/lib/health';

export default function SintomasScreen() {
  const [logs, setLogs] = useState<SymptomLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setError(null);
          const data = await fetchSymptomLogs();
          if (!cancelled) {
            setLogs(data);
          }
        } catch {
          if (!cancelled) {
            setError('Não foi possível carregar seus sintomas.');
            setLogs((current) => current ?? []);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

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
              onPress={() => router.push('/registrar-sintoma')}
              accessibilityRole="button"
            >
              <Text style={styles.registerButtonText}>+ Registrar sintoma</Text>
            </Pressable>
            {error && <Text style={styles.error}>{error}</Text>}
            {logs !== null && logs.length > 0 && (
              <Text style={styles.sectionTitle}>Linha do tempo</Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const occurredAt = new Date(item.occurred_at);
          return (
            <View style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logSymptom}>{symptomTypeLabels[item.symptom]}</Text>
                <Text style={styles.logSeverity}>{symptomSeverityLabels[item.severity]}</Text>
              </View>
              <Text style={styles.logMeta}>
                {formatRelativeDay(occurredAt, new Date())} às {formatTimeHHMM(occurredAt)}
              </Text>
              {item.notes ? <Text style={styles.logNotes}>{item.notes}</Text> : null}
            </View>
          );
        }}
        ListEmptyComponent={
          logs === null ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nenhum sintoma registrado</Text>
              <Text style={styles.emptyText}>
                Se sentir algum efeito colateral, registre aqui — seu médico verá a linha do tempo
                na próxima consulta. Em caso de sintomas intensos, procure atendimento médico.
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
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#6b7280', marginTop: 8 },
  logCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
    gap: 4,
    backgroundColor: '#fff',
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  logSymptom: { fontSize: 16, fontWeight: '600' },
  logSeverity: { fontSize: 14, color: '#0f6e5c', fontWeight: '600' },
  logMeta: { fontSize: 13, color: '#6b7280' },
  logNotes: { fontSize: 14, color: '#1a1a2e' },
  empty: { alignItems: 'center', gap: 8, marginTop: 24, paddingHorizontal: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  error: { color: '#b91c1c' },
});
