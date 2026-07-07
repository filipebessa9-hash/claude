// Documento PDF do relatório de consulta (server-side, @react-pdf/renderer).

import {
  formatDoseMg,
  formatWeightKg,
  injectionSiteLabels,
  symptomSeverityLabels,
  symptomTypeLabels,
  PK_ESTIMATE_DISCLAIMER,
} from '@metalink/core';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import type { PatientReport } from '@/lib/patient-report';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a2e' },
  header: { marginBottom: 12 },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  info: { color: '#6b7280' },
  flag: {
    backgroundColor: '#fdf2f2',
    borderLeft: '2 solid #b91c1c',
    padding: 6,
    marginBottom: 4,
  },
  flagTitle: { fontFamily: 'Helvetica-Bold' },
  row: { flexDirection: 'row', borderBottom: '1 solid #e5e7eb', paddingVertical: 3 },
  headerRow: { flexDirection: 'row', borderBottom: '1 solid #9ca3af', paddingVertical: 3 },
  cellBold: { fontFamily: 'Helvetica-Bold' },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 8,
    color: '#6b7280',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 6,
  },
});

function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatSignedKg(value: number): string {
  return `${value > 0 ? '+' : ''}${String(value).replace('.', ',')} kg`;
}

export function ReportDocument({ report }: { report: PatientReport }) {
  const age = report.birthYear ? new Date().getFullYear() - report.birthYear : null;
  const summary = report.weightSummary;
  const checkins = report.checkinSummary;

  return (
    <Document
      title={`Relatório de consulta — ${report.patientName}`}
      author="MetaLink"
      language="pt-BR"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Relatório de consulta — MetaLink</Text>
          <Text style={styles.subtitle}>
            Paciente: {report.patientName}
            {age !== null ? ` · ${age} anos (aprox.)` : ''}
            {report.heightCm !== null ? ` · ${String(report.heightCm).replace('.', ',')} cm` : ''}
          </Text>
          <Text style={styles.subtitle}>
            Gerado em {formatDateTime(report.generatedAt)} · Períodos: doses 90d · peso 180d ·
            sintomas 30d · check-ins 14d
          </Text>
        </View>

        {report.flags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sinais para atenção (não são diagnóstico)</Text>
            {report.flags.map((flag) => (
              <View key={flag.type} style={styles.flag}>
                <Text style={styles.flagTitle}>{flag.title}</Text>
                <Text>{flag.detail}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Peso</Text>
          {summary ? (
            <Text>
              Último: {formatWeightKg(summary.latestKg)} · Desde o início:{' '}
              {formatSignedKg(summary.totalChangeKg)}
              {summary.change30dKg !== null
                ? ` · Últimos 30 dias: ${formatSignedKg(summary.change30dKg)}`
                : ''}
            </Text>
          ) : (
            <Text style={styles.info}>Sem registros de peso nos últimos 180 dias.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nível estimado de medicação (últimos 30 dias)</Text>
          {report.pkMedicationName ? (
            <Text>
              {report.pkMedicationName}
              {report.pkRelativePct !== null
                ? ` — nível atual estimado em ≈${report.pkRelativePct}% do pico do período.`
                : ' — sem doses no período; nível estimado próximo de zero.'}
            </Text>
          ) : (
            <Text style={styles.info}>Sem registros de dose para estimar o nível.</Text>
          )}
          <Text style={styles.info}>{PK_ESTIMATE_DISCLAIMER}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aderência (últimos 90 dias)</Text>
          {report.adherence ? (
            <Text>
              {report.adherence.adherencePct}% — {report.adherence.taken} de{' '}
              {report.adherence.expected} doses esperadas registradas · Última dose em{' '}
              {formatDateTime(report.adherence.lastDoseAt)}
              {report.adherence.currentGapSlots > 0
                ? ` · ${report.adherence.currentGapSlots} dose(s) esperada(s) sem registro desde então`
                : ''}
            </Text>
          ) : (
            <Text style={styles.info}>
              Sem registros de dose suficientes para estimar aderência.
            </Text>
          )}
          <Text style={styles.info}>
            Estimativa baseada nos registros do paciente (esquema inferido da via do medicamento).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doses registradas (últimos 90 dias)</Text>
          {report.doses.length === 0 ? (
            <Text style={styles.info}>Nenhuma dose registrada no período.</Text>
          ) : (
            <View>
              <View style={styles.headerRow}>
                <Text style={[styles.cellBold, { width: '28%' }]}>Quando</Text>
                <Text style={[styles.cellBold, { width: '28%' }]}>Medicamento</Text>
                <Text style={[styles.cellBold, { width: '16%' }]}>Dose</Text>
                <Text style={[styles.cellBold, { width: '28%' }]}>Local</Text>
              </View>
              {report.doses.slice(0, 20).map((dose) => (
                <View key={dose.id} style={styles.row}>
                  <Text style={{ width: '28%' }}>{formatDateTime(dose.taken_at)}</Text>
                  <Text style={{ width: '28%' }}>
                    {report.medicationsById.get(dose.medication_id)?.brand_name ?? '—'}
                  </Text>
                  <Text style={{ width: '16%' }}>{formatDoseMg(Number(dose.dose_mg))}</Text>
                  <Text style={{ width: '28%' }}>
                    {dose.injection_site ? injectionSiteLabels[dose.injection_site] : '—'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sintomas relatados (últimos 30 dias)</Text>
          {report.symptoms.length === 0 ? (
            <Text style={styles.info}>Nenhum sintoma registrado no período.</Text>
          ) : (
            <View>
              <View style={styles.headerRow}>
                <Text style={[styles.cellBold, { width: '28%' }]}>Quando</Text>
                <Text style={[styles.cellBold, { width: '24%' }]}>Sintoma</Text>
                <Text style={[styles.cellBold, { width: '16%' }]}>Intensidade</Text>
                <Text style={[styles.cellBold, { width: '32%' }]}>Observações</Text>
              </View>
              {report.symptoms.map((symptom) => (
                <View key={symptom.id} style={styles.row}>
                  <Text style={{ width: '28%' }}>{formatDateTime(symptom.occurred_at)}</Text>
                  <Text style={{ width: '24%' }}>{symptomTypeLabels[symptom.symptom]}</Text>
                  <Text style={{ width: '16%' }}>{symptomSeverityLabels[symptom.severity]}</Text>
                  <Text style={{ width: '32%' }}>{symptom.notes ?? '—'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Check-ins diários (últimos 14 dias)</Text>
          {checkins.count === 0 ? (
            <Text style={styles.info}>Nenhum check-in no período.</Text>
          ) : (
            <Text>
              {checkins.count} dia(s) respondido(s)
              {checkins.hungerAvg !== null
                ? ` · Fome ${String(checkins.hungerAvg).replace('.', ',')}/5`
                : ''}
              {checkins.foodNoiseAvg !== null
                ? ` · Food noise ${String(checkins.foodNoiseAvg).replace('.', ',')}/5`
                : ''}
              {checkins.moodAvg !== null
                ? ` · Humor ${String(checkins.moodAvg).replace('.', ',')}/5`
                : ''}
              {checkins.energyAvg !== null
                ? ` · Energia ${String(checkins.energyAvg).replace('.', ',')}/5`
                : ''}
              {checkins.hydrationYesPct !== null
                ? ` · Hidratação ok ${checkins.hydrationYesPct}%`
                : ''}
              {checkins.proteinYesPct !== null ? ` · Proteína ok ${checkins.proteinYesPct}%` : ''}
            </Text>
          )}
        </View>

        <Text style={styles.footer} fixed>
          Relatório gerado pelo MetaLink a partir de registros feitos pelo próprio paciente. Apoia —
          e não substitui — a avaliação clínica do médico. Documento confidencial: contém dados
          sensíveis de saúde (LGPD).
        </Text>
      </Page>
    </Document>
  );
}
