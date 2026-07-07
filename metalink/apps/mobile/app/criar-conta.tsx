import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '@/lib/supabase';

// ASSUMPTION: pacientes se cadastram pelo app móvel; médicos, pelo painel web.
export default function CriarContaScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setError(null);
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (!accepted) {
      setError('Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.');
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      // accepted_terms vira registro de consentimento no banco (trigger de signup).
      options: { data: { role: 'patient', full_name: fullName, accepted_terms: 'true' } },
    });
    setLoading(false);
    if (signUpError) {
      setError('Não foi possível criar a conta. Verifique os dados e tente novamente.');
      return;
    }
    if (data.session) {
      router.replace('/home');
    } else {
      // Projeto com confirmação de e-mail habilitada.
      setError(null);
      router.replace('/entrar');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>
        Acompanhe sua jornada e compartilhe com seu médico apenas o que você autorizar.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={fullName}
        onChangeText={setFullName}
        accessibilityLabel="Nome"
      />
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
        placeholder="Senha (mín. 8 caracteres)"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
        accessibilityLabel="Senha"
      />
      <Pressable
        style={styles.consentRow}
        onPress={() => setAccepted((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
      >
        <Text style={styles.checkbox}>{accepted ? '☑' : '☐'}</Text>
        <Text style={styles.consentText}>
          Li e aceito os{' '}
          <Link href="/termos" style={styles.inlineLink}>
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link href="/politica-privacidade" style={styles.inlineLink}>
            Política de Privacidade
          </Link>
          .
        </Text>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={loading}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{loading ? 'Criando conta…' : 'Criar conta'}</Text>
      </Pressable>
      <Link href="/entrar" style={styles.link}>
        Já tem conta? Entrar
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 8 },
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
  consentRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', minHeight: 44 },
  checkbox: { fontSize: 20, color: '#0f6e5c', lineHeight: 24 },
  consentText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },
  inlineLink: { color: '#0f6e5c', textDecorationLine: 'underline' },
});
