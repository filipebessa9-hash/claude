import { ScrollView, StyleSheet, Text } from 'react-native';

// LEGAL: revisar com advogado — texto placeholder, NÃO usar em produção.
export default function PoliticaPrivacidadeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Política de Privacidade
      </Text>
      <Text style={styles.paragraph}>
        [PLACEHOLDER — revisar com advogado antes do lançamento.]
      </Text>
      <Text style={styles.paragraph}>
        1. Coletamos o mínimo necessário: nome, e-mail, e os registros de saúde que você mesmo
        insere (doses, peso, sintomas, check-ins). Dados de saúde são dados sensíveis sob a LGPD e
        são tratados com criptografia em repouso e em trânsito.
      </Text>
      <Text style={styles.paragraph}>
        2. Seus dados só ficam visíveis para um médico quando você aceita o convite dele e autoriza
        o compartilhamento. Todo acesso do médico aos seus dados fica registrado em log de
        auditoria.
      </Text>
      <Text style={styles.paragraph}>
        3. Você pode, a qualquer momento e pelo próprio app: exportar uma cópia de todos os seus
        dados, revogar o compartilhamento com médicos, e excluir sua conta com eliminação dos seus
        dados pessoais.
      </Text>
      <Text style={styles.paragraph}>
        4. Não vendemos seus dados nem os usamos para publicidade. Não somos vinculados a nenhuma
        farmacêutica.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  paragraph: { fontSize: 14, lineHeight: 21, color: '#1a1a2e' },
});
