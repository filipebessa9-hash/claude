import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text } from 'react-native';

import { deleteMyAccount, exportMyData, revokeAllSharing } from '@/lib/privacy';

export default function DadosScreen() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const json = await exportMyData();
      await Share.share({ title: 'Meus dados — MetaLink', message: json });
    } catch {
      setError('Não foi possível exportar seus dados. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  function handleRevokeAll() {
    Alert.alert(
      'Revogar todo o compartilhamento?',
      'Nenhum médico verá mais seus registros até você autorizar de novo com um novo convite.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revogar tudo',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            try {
              await revokeAllSharing();
              setMessage('Compartilhamento revogado. Nenhum médico tem mais acesso.');
            } catch {
              setError('Não foi possível revogar. Tente novamente.');
            }
          },
        },
      ],
    );
  }

  function handleDelete() {
    Alert.alert(
      'Excluir sua conta?',
      'Todos os seus registros (doses, peso, sintomas, check-ins e vínculos) serão apagados de forma permanente. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Tem certeza?', 'Confirme a exclusão permanente da sua conta e dados.', [
              { text: 'Voltar', style: 'cancel' },
              {
                text: 'Excluir permanentemente',
                style: 'destructive',
                onPress: async () => {
                  setError(null);
                  setBusy(true);
                  try {
                    await deleteMyAccount();
                    router.replace('/entrar');
                  } catch {
                    setError('Não foi possível excluir a conta. Tente novamente.');
                    setBusy(false);
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Seus dados são seus. Aqui você exerce seus direitos previstos na LGPD, direto do app e sem
        burocracia.
      </Text>

      <Pressable
        style={styles.button}
        onPress={handleExport}
        disabled={busy}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Exportar meus dados (JSON)</Text>
      </Pressable>
      <Text style={styles.hint}>
        Uma cópia completa de tudo o que você registrou, para guardar ou levar a outro serviço.
      </Text>

      <Pressable style={styles.button} onPress={handleRevokeAll} accessibilityRole="button">
        <Text style={styles.buttonText}>Revogar todo o compartilhamento</Text>
      </Pressable>
      <Text style={styles.hint}>
        Corta imediatamente o acesso de todos os médicos aos seus registros.
      </Text>

      <Pressable style={styles.dangerButton} onPress={handleDelete} accessibilityRole="button">
        <Text style={styles.dangerButtonText}>Excluir minha conta e dados</Text>
      </Pressable>
      <Text style={styles.hint}>
        Eliminação permanente da conta e de todos os registros (direito de eliminação).
      </Text>

      {message && <Text style={styles.success}>{message}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable onPress={() => router.push('/termos')} accessibilityRole="link">
        <Text style={styles.link}>Termos de Uso</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/politica-privacidade')} accessibilityRole="link">
        <Text style={styles.link}>Política de Privacidade</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 10 },
  intro: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 8 },
  button: {
    borderWidth: 1,
    borderColor: '#0f6e5c',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    minHeight: 48,
    marginTop: 8,
  },
  buttonText: { color: '#0f6e5c', fontSize: 15, fontWeight: '600' },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#b91c1c',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    minHeight: 48,
    marginTop: 8,
  },
  dangerButtonText: { color: '#b91c1c', fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 12, color: '#6b7280', lineHeight: 17 },
  success: { color: '#0f6e5c', marginTop: 8 },
  error: { color: '#b91c1c', marginTop: 8 },
  link: { color: '#0f6e5c', textDecorationLine: 'underline', marginTop: 12, minHeight: 32 },
});
