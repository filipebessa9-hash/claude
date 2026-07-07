import { toLocalDateString } from '@metalink/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { fetchCheckin, upsertCheckin } from '@/lib/health';

const SCALE = [1, 2, 3, 4, 5] as const;

interface ScaleRowProps {
  title: string;
  lowLabel: string;
  highLabel: string;
  value: number | null;
  onChange: (value: number | null) => void;
}

function ScaleRow({ title, lowLabel, highLabel, value, onChange }: ScaleRowProps) {
  return (
    <View style={styles.scaleBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipRow}>
        {SCALE.map((option) => (
          <Chip
            key={option}
            label={String(option)}
            selected={value === option}
            onPress={() => onChange(value === option ? null : option)}
          />
        ))}
      </View>
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>{lowLabel}</Text>
        <Text style={styles.scaleLabel}>{highLabel}</Text>
      </View>
    </View>
  );
}

interface YesNoRowProps {
  title: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}

function YesNoRow({ title, value, onChange }: YesNoRowProps) {
  return (
    <View style={styles.scaleBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipRow}>
        <Chip
          label="Sim"
          selected={value === true}
          onPress={() => onChange(value === true ? null : true)}
        />
        <Chip
          label="Não"
          selected={value === false}
          onPress={() => onChange(value === false ? null : false)}
        />
      </View>
    </View>
  );
}

export default function CheckInScreen() {
  const [loaded, setLoaded] = useState(false);
  const [hunger, setHunger] = useState<number | null>(null);
  const [foodNoise, setFoodNoise] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [hydrationOk, setHydrationOk] = useState<boolean | null>(null);
  const [proteinOk, setProteinOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const today = toLocalDateString(new Date());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await fetchCheckin(today);
        if (cancelled) {
          return;
        }
        if (existing) {
          setHunger(existing.hunger);
          setFoodNoise(existing.food_noise);
          setMood(existing.mood);
          setEnergy(existing.energy);
          setHydrationOk(existing.hydration_ok);
          setProteinOk(existing.protein_ok);
        }
        setLoaded(true);
      } catch {
        if (!cancelled) {
          setError('Não foi possível carregar o check-in de hoje.');
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [today]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await upsertCheckin({
        checkinDate: today,
        hunger,
        foodNoise,
        mood,
        energy,
        hydrationOk,
        proteinOk,
      });
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hint}>
        Como foi seu dia? Responda só o que quiser — tudo aqui é opcional e você pode ajustar ao
        longo do dia.
      </Text>

      <ScaleRow
        title="Fome"
        lowLabel="Pouca"
        highLabel="Muita"
        value={hunger}
        onChange={setHunger}
      />
      <ScaleRow
        title="“Food noise” (pensamentos sobre comida)"
        lowLabel="Quase nenhum"
        highLabel="O tempo todo"
        value={foodNoise}
        onChange={setFoodNoise}
      />
      <ScaleRow
        title="Humor"
        lowLabel="Difícil"
        highLabel="Ótimo"
        value={mood}
        onChange={setMood}
      />
      <ScaleRow
        title="Energia"
        lowLabel="Baixa"
        highLabel="Alta"
        value={energy}
        onChange={setEnergy}
      />
      <YesNoRow title="Bebeu água o suficiente?" value={hydrationOk} onChange={setHydrationOk} />
      <YesNoRow title="Comeu proteína o suficiente?" value={proteinOk} onChange={setProteinOk} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
      >
        <Text style={styles.saveButtonText}>{saving ? 'Salvando…' : 'Salvar check-in'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  scaleBlock: { marginTop: 14, gap: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleLabel: { fontSize: 12, color: '#6b7280' },
  hint: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
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
