import { renderToBuffer } from '@react-pdf/renderer';

import { fetchPatientReport, logPatientAccess } from '@/lib/patient-report';
import { createClient } from '@/lib/supabase/server';

import { ReportDocument } from './report-pdf';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Não autenticado', { status: 401 });
  }
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!me || me.role !== 'provider') {
    return new Response('Acesso restrito a médicos', { status: 403 });
  }

  const report = await fetchPatientReport(supabase, id);
  if (!report) {
    return new Response('Paciente não encontrado ou sem acesso', { status: 404 });
  }

  // Exportar o relatório é acesso a dados do paciente: auditado (Seção 7).
  await logPatientAccess(supabase, 'export_consultation_report', id);

  const buffer = await renderToBuffer(<ReportDocument report={report} />);
  const date = report.generatedAt.toISOString().slice(0, 10);

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-consulta-${date}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
