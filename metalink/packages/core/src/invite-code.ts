// Código de convite paciente ↔ médico (Fatia 3).
// A normalização é espelhada em supabase/migrations/0003 (normalize_invite_code):
// remove espaços/hífens, caixa alta e corrige confusões de leitura (O→0, I/L→1).

export const INVITE_CODE_LENGTH = 8;

export function normalizeInviteCode(text: string): string {
  return text.replace(/[\s-]/g, '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
}

/** O código gerado pelo banco é hex maiúsculo de 8 caracteres. */
export function isCompleteInviteCode(text: string): boolean {
  return /^[0-9A-F]{8}$/.test(normalizeInviteCode(text));
}
