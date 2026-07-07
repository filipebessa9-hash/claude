import { ScrollView, StyleSheet, Text } from 'react-native';

// LEGAL: revisar com advogado — texto placeholder, NÃO usar em produção.
export default function TermosScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Termos de Uso
      </Text>
      <Text style={styles.paragraph}>
        [PLACEHOLDER — revisar com advogado antes do lançamento.]
      </Text>
      <Text style={styles.paragraph}>
        1. O MetaLink é uma ferramenta de registro e acompanhamento. Ele não realiza diagnóstico,
        não prescreve medicamentos e não substitui a avaliação de um profissional de saúde.
      </Text>
      <Text style={styles.paragraph}>
        2. As decisões sobre seu tratamento — incluindo doses, horários e mudanças de medicação —
        são sempre do seu médico. Em caso de sintomas intensos ou emergência, procure atendimento
        médico imediatamente.
      </Text>
      <Text style={styles.paragraph}>
        3. Você é responsável pela exatidão dos dados que registra e por manter suas credenciais de
        acesso em segurança.
      </Text>
      <Text style={styles.paragraph}>
        4. O compartilhamento de dados com seu médico só acontece com o seu consentimento explícito
        e pode ser revogado a qualquer momento no app.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  paragraph: { fontSize: 14, lineHeight: 21, color: '#1a1a2e' },
});
