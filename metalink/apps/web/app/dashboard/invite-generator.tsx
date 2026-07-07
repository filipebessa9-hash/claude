'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

interface GeneratedCode {
  code: string;
  expires_at: string | null;
}

/** Botão "Gerar código de convite" + exibição do código para compartilhar. */
export function InviteGenerator() {
  const router = useRouter();
  const [generated, setGenerated] = useState<GeneratedCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc('create_invite_code', {
      p_expires_in_days: 14,
      p_max_uses: 1,
    });
    setLoading(false);
    if (rpcError || !data) {
      setError('Não foi possível gerar o código. Tente novamente.');
      return;
    }
    setGenerated(data as GeneratedCode);
    router.refresh();
  }

  return (
    <div className="invite-generator">
      <button type="button" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Gerando…' : 'Gerar código de convite'}
      </button>
      {generated && (
        <p className="invite-code" aria-live="polite">
          Código: <strong>{generated.code}</strong>
          <span className="info"> — envie ao paciente; válido por 14 dias, uso único.</span>
        </p>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
