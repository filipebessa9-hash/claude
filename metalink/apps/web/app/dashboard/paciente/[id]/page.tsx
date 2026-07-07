import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import {
  buildSeriesChartPoints,
  buildWeightChartPoints,
  formatDoseMg,
  formatWeightKg,
  injectionSiteLabels,
  symptomSeverityLabels,
  symptomTypeLabels,
  PK_ESTIMATE_DISCLAIMER,
} from '@metalink/core';

import { fetchPatientReport, logPatientAccess } from '@/lib/patient-report';
import { createClient } from '@/lib/supabase/server';

const CHART_WIDTH = 560;
const CHART_HEIGHT = 160;

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatSignedKg(value: number): string {
  return `${value > 0 ? '+' : ''}${String(value).replace('.', ',')} kg`;
}

export default async function PacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!me || me.role !== 'provider') {
    redirect('/dashboard');
  }

  const report = await fetchPatientReport(supabase, id);
  if (!report) {
    notFound();
  }

  // Todo acesso do médico a dados do paciente é auditado (Seção 7).
  await logPatientAccess(supabase, 'view_patient_dashboard', id);

  const chartPoints = buildWeightChartPoints(report.weightPoints, {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    padding: 10,
  });
  const age = report.birthYear ? new Date().getFullYear() - report.birthYear : null;

  return (
    <main className="centered wide">
      <p>
        <Link href="/dashboard">← Voltar ao painel</Link>
      </p>
      <h1>{report.patientName}</h1>
      <p className="info">
        {age !== null ? `${age} anos (aprox.)` : 'Idade não informada'}
        {report.heightCm !== null ? ` · ${String(report.heightCm).replace('.', ',')} cm` : ''}
      </p>
      <p>
        <a href={`/dashboard/paciente/${id}/relatorio`}>Baixar relatório de consulta (PDF)</a>
      </p>

      {report.flags.length > 0 && (
        <section>
          <h2>Sinais para sua atenção</h2>
          <p className="info">
            Destaques automáticos a partir dos registros do paciente — não são diagnóstico.
          </p>
          <ul className="flag-list">
            {report.flags.map((flag) => (
              <li key={flag.type} className="flag">
                <strong>{flag.title}</strong> — {flag.detail}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Peso</h2>
        {report.weightSummary ? (
          <>
            <p>
              Último: <strong>{formatWeightKg(report.weightSummary.latestKg)}</strong>
              {' · '}Desde o início:{' '}
              <strong>{formatSignedKg(report.weightSummary.totalChangeKg)}</strong>
              {report.weightSummary.change30dKg !== null && (
                <>
                  {' · '}30 dias:{' '}
                  <strong>{formatSignedKg(report.weightSummary.change30dKg)}</strong>
                </>
              )}
            </p>
            {chartPoints.length >= 2 && (
              <svg
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                role="img"
                aria-label="Gráfico de tendência de peso"
                className="chart"
              >
                <polyline
                  points={chartPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#0f6e5c"
                  strokeWidth={2}
                />
                {chartPoints.map((p, index) => (
                  <circle key={index} cx={p.x} cy={p.y} r={3} fill="#0f6e5c" />
                ))}
              </svg>
            )}
          </>
        ) : (
          <p className="info">Sem registros de peso nos últimos 180 dias.</p>
        )}
      </section>

      <section>
        <h2>Nível estimado de medicação (últimos 30 dias)</h2>
        {report.pkCurve && report.pkMedicationName ? (
          <>
            <p>
              {report.pkMedicationName}
              {report.pkRelativePct !== null
                ? ` — agora em ≈${report.pkRelativePct}% do pico do período.`
                : ' — sem doses no período; nível estimado próximo de zero.'}
            </p>
            {(() => {
              const pkPoints = buildSeriesChartPoints(
                report.pkCurve.map((p) => ({ t: p.at, value: p.level })),
                { width: CHART_WIDTH, height: CHART_HEIGHT, padding: 10 },
              );
              return (
                pkPoints.length >= 2 && (
                  <svg
                    width={CHART_WIDTH}
                    height={CHART_HEIGHT}
                    role="img"
                    aria-label="Curva estimada do nível de medicação"
                    className="chart"
                  >
                    <polyline
                      points={pkPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#0f6e5c"
                      strokeWidth={2}
                    />
                  </svg>
                )
              );
            })()}
          </>
        ) : (
          <p className="info">Sem registros de dose para estimar o nível.</p>
        )}
        <p className="info">{PK_ESTIMATE_DISCLAIMER}</p>
      </section>

      <section>
        <h2>Aderência (últimos 90 dias)</h2>
        {report.adherence ? (
          <p>
            <strong>{report.adherence.adherencePct}%</strong> — {report.adherence.taken} de{' '}
            {report.adherence.expected} doses esperadas registradas · Última dose em{' '}
            {formatDate(report.adherence.lastDoseAt)}
            {report.adherence.currentGapSlots > 0 &&
              ` · ${report.adherence.currentGapSlots} dose(s) esperada(s) sem registro desde então`}
          </p>
        ) : (
          <p className="info">Sem registros de dose suficientes para estimar aderência.</p>
        )}
        <p className="info">
          Estimativa baseada nos registros do paciente (esquema inferido da via do medicamento).
        </p>
      </section>

      <section>
        <h2>Doses registradas (últimos 90 dias)</h2>
        {report.doses.length === 0 ? (
          <p className="info">Nenhuma dose registrada no período.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Medicamento</th>
                <th>Dose</th>
                <th>Local</th>
              </tr>
            </thead>
            <tbody>
              {report.doses.slice(0, 15).map((dose) => (
                <tr key={dose.id}>
                  <td>{formatDateTime(dose.taken_at)}</td>
                  <td>{report.medicationsById.get(dose.medication_id)?.brand_name ?? '—'}</td>
                  <td>{formatDoseMg(Number(dose.dose_mg))}</td>
                  <td>{dose.injection_site ? injectionSiteLabels[dose.injection_site] : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Sintomas relatados (últimos 30 dias)</h2>
        {report.symptoms.length === 0 ? (
          <p className="info">Nenhum sintoma registrado no período.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Sintoma</th>
                <th>Intensidade</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {report.symptoms.map((symptom) => (
                <tr key={symptom.id}>
                  <td>{formatDateTime(symptom.occurred_at)}</td>
                  <td>{symptomTypeLabels[symptom.symptom]}</td>
                  <td>{symptomSeverityLabels[symptom.severity]}</td>
                  <td>{symptom.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Check-ins (últimos 14 dias)</h2>
        {report.checkinSummary.count === 0 ? (
          <p className="info">Nenhum check-in no período.</p>
        ) : (
          <p>
            {report.checkinSummary.count} dia(s) respondido(s)
            {report.checkinSummary.hungerAvg !== null &&
              ` · Fome ${String(report.checkinSummary.hungerAvg).replace('.', ',')}/5`}
            {report.checkinSummary.foodNoiseAvg !== null &&
              ` · Food noise ${String(report.checkinSummary.foodNoiseAvg).replace('.', ',')}/5`}
            {report.checkinSummary.moodAvg !== null &&
              ` · Humor ${String(report.checkinSummary.moodAvg).replace('.', ',')}/5`}
            {report.checkinSummary.energyAvg !== null &&
              ` · Energia ${String(report.checkinSummary.energyAvg).replace('.', ',')}/5`}
            {report.checkinSummary.hydrationYesPct !== null &&
              ` · Hidratação ok ${report.checkinSummary.hydrationYesPct}%`}
            {report.checkinSummary.proteinYesPct !== null &&
              ` · Proteína ok ${report.checkinSummary.proteinYesPct}%`}
          </p>
        )}
      </section>

      <p className="info">
        Dados registrados pelo próprio paciente no MetaLink. Este painel apoia — e não substitui —
        sua avaliação clínica.
      </p>
    </main>
  );
}
