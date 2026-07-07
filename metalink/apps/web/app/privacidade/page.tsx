// LEGAL: revisar com advogado — texto placeholder, NÃO usar em produção.
export default function PrivacidadePage() {
  return (
    <main className="centered wide">
      <h1>Política de Privacidade</h1>
      <p className="info">[PLACEHOLDER — revisar com advogado antes do lançamento.]</p>
      <p>
        1. Dados de saúde são dados sensíveis sob a LGPD e são tratados com criptografia em repouso
        e em trânsito, controle de acesso por papel no banco de dados e log de auditoria de todo
        acesso de médico/administrador a dados de paciente.
      </p>
      <p>
        2. Um médico só acessa os dados de pacientes explicitamente vinculados a ele e que
        consentiram o compartilhamento — o consentimento é revogável a qualquer momento pelo
        paciente.
      </p>
      <p>
        3. O titular pode exportar seus dados e solicitar a eliminação da conta diretamente pelo
        aplicativo, sem burocracia.
      </p>
      <p>
        4. Não vendemos dados nem os usamos para publicidade. Não somos vinculados a nenhuma
        farmacêutica.
      </p>
    </main>
  );
}
