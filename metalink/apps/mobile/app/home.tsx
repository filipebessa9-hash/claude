import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { session, loading } = useAuth();

  if (!loading && !session) {
    return <Redirect href="/entrar" />;
  }

  const name = (session?.user.user_metadata?.full_name as string | undefined) ?? '';

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/entrar');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name ? `Olá, ${name}!` : 'Olá!'}</Text>
      <Text style={styles.subtitle}>
        Sua conta está pronta. Em breve você poderá registrar suas doses aqui em poucos segundos —
        este é o próximo passo do MetaLink.
      </Text>
      <Pressable style={styles.button} onPress={handleSignOut} accessibilityRole="button">
        <Text style={styles.buttonText}>Sair</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  button: {
    borderWidth: 1,
    borderColor: '#0f6e5c',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  buttonText: { color: '#0f6e5c', fontSize: 16, fontWeight: '600' },
});
