import {
  formatDoseMg,
  formatRelativeDay,
  formatTimeHHMM,
  injectionSiteLabels,
} from '@metalink/core';
import type { DoseLog, Medication } from '@metalink/db';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth-context';
import { fetchMedications, fetchRecentDoses } from '@/lib/doses';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { session, loading } = useAuth();
  const [doses, setDoses] = useState<DoseLog[] | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [recentDoses, meds] = await Promise.all([fetchRecentDoses(), fetchMedications()]);
      setDoses(recentDoses);
      setMedications(meds);
    } catch {
      setError('Não foi possível carregar seus registros. Arraste para tentar de novo.');
      setDoses((current) => current ?? []);
    }
  }, []);

  // Recarrega ao voltar da tela de registro.
  useFocusEffect(
    useCallback(() => {
      if (session) {
        void load();
      }
    }, [session, load]),
  );

  const medicationNames = useMemo(
    () => new Map(medications.map((m) => [m.id, m.brand_name])),
    [medications],
  );

  if (!loading && !session) {
    return <Redirect href="/entrar" />;
  }

  const name = (session?.user.user_metadata?.full_name as string | undefined) ?? '';

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/entrar');
  }

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function renderDose({ item }: { item: DoseLog }) {
    const takenAt = new Date(item.taken_at);
    return (
      <View style={styles.doseCard}>
        <View style={styles.doseCardHeader}>
          <Text style={styles.doseMedication}>
            {medicationNames.get(item.medication_id) ?? 'Medicamento'}
          </Text>
          <Text style={styles.doseAmount}>{formatDoseMg(item.dose_mg)}</Text>
        </View>
        <Text style={styles.doseMeta}>
          {formatRelativeDay(takenAt, new Date())} às {formatTimeHHMM(takenAt)}
          {item.injection_site ? ` · ${injectionSiteLabels[item.injection_site]}` : ''}
        </Text>
        {item.notes ? <Text style={styles.doseNotes}>{item.notes}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={doses ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderDose}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{name ? `Olá, ${name}!` : 'Olá!'}</Text>
            <Pressable
              style={styles.registerButton}
              onPress={() => router.push('/registrar-dose')}
              accessibilityRole="button"
            >
              <Text style={styles.registerButtonText}>+ Registrar dose</Text>
            </Pressable>
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.actionButton}
                onPress={() => router.push('/peso')}
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>Peso</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => router.push('/sintomas')}
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>Sintomas</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => router.push('/check-in')}
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>Check-in</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => router.push('/nivel')}
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>Nível</Text>
              </Pressable>
            </View>
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.linkButton}
                onPress={() => router.push('/resumo')}
                accessibilityRole="button"
              >
                <Text style={styles.linkButtonText}>Resumo da semana</Text>
              </Pressable>
              <Pressable
                style={styles.linkButton}
                onPress={() => router.push('/lembretes')}
                accessibilityRole="button"
              >
                <Text style={styles.linkButtonText}>Lembretes</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.linkButton}
              onPress={() => router.push('/medico')}
              accessibilityRole="button"
            >
              <Text style={styles.linkButtonText}>Meu médico</Text>
            </Pressable>
            {error && <Text style={styles.error}>{error}</Text>}
            {doses !== null && doses.length > 0 && (
              <Text style={styles.sectionTitle}>Suas aplicações</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          doses === null ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Comece pela sua primeira dose</Text>
              <Text style={styles.emptyText}>
                Toque em “Registrar dose” e anote sua aplicação em poucos segundos. Seu histórico
                aparecerá aqui, no seu ritmo — sem cobranças.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <Pressable onPress={handleSignOut} accessibilityRole="button" style={styles.signOut}>
            <Text style={styles.signOutText}>Sair da conta</Text>
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 20, paddingBottom: 40 },
  header: { gap: 12, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '600' },
  registerButton: {
    backgroundColor: '#0f6e5c',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    minHeight: 56,
  },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#0f6e5c',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  actionButtonText: { color: '#0f6e5c', fontSize: 15, fontWeight: '600' },
  linkButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  linkButtonText: { color: '#1a1a2e', fontSize: 15, fontWeight: '500' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#6b7280', marginTop: 8 },
  doseCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
    gap: 4,
    backgroundColor: '#fff',
  },
  doseCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  doseMedication: { fontSize: 16, fontWeight: '600' },
  doseAmount: { fontSize: 16, fontWeight: '600', color: '#0f6e5c' },
  doseMeta: { fontSize: 13, color: '#6b7280' },
  doseNotes: { fontSize: 14, color: '#1a1a2e' },
  empty: { alignItems: 'center', gap: 8, marginTop: 24, paddingHorizontal: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  error: { color: '#b91c1c' },
  signOut: { alignItems: 'center', marginTop: 28, minHeight: 44, justifyContent: 'center' },
  signOutText: { color: '#6b7280', textDecorationLine: 'underline' },
});
