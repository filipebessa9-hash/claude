import { Pressable, StyleSheet, Text } from 'react-native';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Chip de seleção padrão do app (alvo de toque >= 44pt, estado acessível). */
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  text: { fontSize: 15, color: '#1a1a2e' },
  textSelected: { color: '#fff', fontWeight: '600' },
});
