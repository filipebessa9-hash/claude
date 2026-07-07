// LEGAL: revisar com advogado — texto placeholder, NÃO usar em produção.
export default function TermosPage() {
  return (
    <main className="centered wide">
      <h1>Termos de Uso</h1>
      <p className="info">[PLACEHOLDER — revisar com advogado antes do lançamento.]</p>
      <p>
        1. O MetaLink é uma ferramenta de registro e apoio ao acompanhamento clínico. Ele não
        realiza diagnóstico, não prescreve medicamentos e não substitui o julgamento profissional do
        médico.
      </p>
      <p>
        2. O painel exibe dados registrados pelo próprio paciente, mediante consentimento explícito
        e revogável. Todo acesso a dados de paciente é registrado em log de auditoria.
      </p>
      <p>
        3. O profissional é responsável pelas decisões clínicas tomadas com apoio das informações
        exibidas e por manter suas credenciais em segurança.
      </p>
    </main>
  );
}
