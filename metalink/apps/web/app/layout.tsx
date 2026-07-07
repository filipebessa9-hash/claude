import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'MetaLink — Painel do médico',
  description: 'Acompanhamento de pacientes em terapia com análogos de GLP-1.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
