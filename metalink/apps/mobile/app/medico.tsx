import { isCompleteInviteCode } from '@metalink/core';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  fetchLinkedProviders,
  inviteErrorMessage,
  previewInvite,
  redeemInvite,
  revokeLink,
  type InvitePreview,
  type LinkedProvider,
} from '@/lib/provider-link';

export default function MedicoScreen() {
  const [links, setLinks] = useState<LinkedProvider[] | null>(null);
  const [codeText, setCodeText] = useState('');
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLinks(await fetchLinkedProviders());
    } catch {
      setError('Não foi possível carregar seus vínculos.');
      setLinks((current) => current ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handlePreview() {
    setError(null);
    if (!isCompleteInviteCode(codeText)) {
      setError('O código tem 8 caracteres (letras e números). Confira e tente de novo.');
      return;
    }
    setBusy(true);
    try {
      setPreview(await previewInvite(codeText));
    } catch (e) {
      setError(inviteErrorMessage(e instanceof Error ? e.message : ''));
    } finally {
      setBusy(false);
    }
  }

  async function handleRedeem() {
    setError(null);
    setBusy(true);
    try {
      await redeemInvite(codeText);
      setPreview(null);
      setCodeText('');
      await load();
    } catch (e) {
      setError(inviteErrorMessage(e instanceof Error ? e.message : ''));
    } finally {
      setBusy(false);
    }
  }

  function confirmRevoke(item: LinkedProvider) {
    Alert.alert(
      'Revogar acesso?',
      `${item.providerName} deixará de ver seus registros imediatamente. Você pode se vincular de novo com um novo convite.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revogar',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeLink(item.link.id);
              await load();
            } catch {
              setError('Não foi possível revogar. Tente novamente.');
            }
          },
        },
      ],
    );
  }

  if (links === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {links.length > 0 && (
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Acompanhando você</Text>
          {links.map((item) => (
            <View key={item.link.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.providerName}</Text>
              {item.providerCrm && <Text style={styles.cardMeta}>{item.providerCrm}</Text>}
              <Text style={styles.cardMeta}>
                Compartilhando: doses, peso, sintomas e check-ins.
              </Text>
              <Pressable
                style={styles.revokeButton}
                onPress={() => confirmRevoke(item)}
                accessibilityRole="button"
              >
                <Text style={styles.revokeButtonText}>Revogar acesso</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.block}>
        <Text style={styles.sectionTitle}>
          {links.length > 0 ? 'Vincular outro médico' : 'Vincular meu médico'}
        </Text>
        <Text style={styles.hint}>
          Digite o código de convite que seu médico enviou. Nada é compartilhado sem a sua
          confirmação.
        </Text>
        <TextInput
          style={styles.input}
          value={codeText}
          onChangeText={(text) => {
            setCodeText(text);
            setPreview(null);
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="Ex.: A1B2C3D4"
          accessibilityLabel="Código de convite"
        />
        {!preview && (
          <Pressable
            style={[styles.primaryButton, busy && styles.buttonDisabled]}
            onPress={handlePreview}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {busy ? 'Verificando…' : 'Verificar código'}
            </Text>
          </Pressable>
        )}

        {preview && (
          <View style={styles.consentCard}>
            <Text style={styles.cardTitle}>
              {preview.providerName}
              {preview.providerCrm ? ` — ${preview.providerCrm}` : ''}
            </Text>
            {preview.clinicName && <Text style={styles.cardMeta}>{preview.clinicName}</Text>}
            {/* LEGAL: revisar com advogado — texto de consentimento LGPD. */}
            <Text style={styles.consentText}>
              Ao confirmar, você autoriza este(a) médico(a) a visualizar seus registros no MetaLink:
              doses aplicadas, peso, sintomas e check-ins diários. Você pode revogar esta
              autorização a qualquer momento nesta tela.
            </Text>
            <Pressable
              style={[styles.primaryButton, busy && styles.buttonDisabled]}
              onPress={handleRedeem}
              disabled={busy}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>
                {busy ? 'Confirmando…' : 'Autorizar e vincular'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setPreview(null)}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Agora não</Text>
            </Pressable>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 20 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  block: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    letterSpacing: 2,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    gap: 6,
    backgroundColor: '#fff',
  },
  consentCard: {
    borderWidth: 1,
    borderColor: '#0f6e5c',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    backgroundColor: '#eef6f4',
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardMeta: { fontSize: 13, color: '#6b7280' },
  consentText: { fontSize: 14, lineHeight: 20, color: '#1a1a2e' },
  primaryButton: {
    backgroundColor: '#0f6e5c',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { alignItems: 'center', padding: 10, minHeight: 44, justifyContent: 'center' },
  secondaryButtonText: { color: '#0f6e5c', fontSize: 15 },
  revokeButton: {
    borderWidth: 1,
    borderColor: '#b91c1c',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    minHeight: 44,
    marginTop: 4,
  },
  revokeButtonText: { color: '#b91c1c', fontSize: 15, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  error: { color: '#b91c1c' },
});
