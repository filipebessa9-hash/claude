'use client';

import Link from 'next/link';
import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

// ASSUMPTION: médicos se cadastram pelo painel web; pacientes, pelo app móvel.
// A verificação real do CRM (validação junto ao conselho) fica para fatia futura;
// por ora o CRM é autodeclarado e o vínculo com pacientes exige convite.
export default function CadastroPage() {
  const [fullName, setFullName] = useState('');
  const [crm, setCrm] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!accepted) {
      setError('Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'provider', full_name: fullName, crm, accepted_terms: 'true' },
      },
    });
    setLoading(false);
    if (signUpError) {
      setError('Não foi possível criar a conta. Verifique os dados e tente novamente.');
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="centered">
        <h1>Confira seu e-mail</h1>
        <p className="info">
          Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar,{' '}
          <Link href="/login">entre no painel</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="centered">
      <h1>Cadastro — Médico(a)</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Nome completo
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          CRM (com UF)
          <input value={crm} onChange={(e) => setCrm(e.target.value)} placeholder="CRM-SP 123456" />
        </label>
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="consent-row">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            Li e aceito os <Link href="/termos">Termos de Uso</Link> e a{' '}
            <Link href="/privacidade">Política de Privacidade</Link>.
          </span>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
      <p className="info">
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </main>
  );
}
