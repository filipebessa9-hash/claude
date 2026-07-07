import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '@/lib/supabase';

export default function EntrarScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError('E-mail ou senha inválidos.');
      return;
    }
    router.replace('/home');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo(a) de volta</Text>
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        accessibilityLabel="E-mail"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        autoComplete="current-password"
        value={password}
        onChangeText={setPassword}
        accessibilityLabel="Senha"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={loading}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{loading ? 'Entrando…' : 'Entrar'}</Text>
      </Pressable>
      <Link href="/criar-conta" style={styles.link}>
        Ainda não tem conta? Criar conta
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0f6e5c',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#b91c1c' },
  link: { textAlign: 'center', color: '#0f6e5c', marginTop: 8 },
});
