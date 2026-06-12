// Re-export registry + helper role untuk client component
export * from './doc-types';
import type { DocTypeDef } from './doc-types';

// VIEWER tidak boleh menulis; FINANCE hanya dokumen finansial
export function canWriteDoc(role: string, def?: DocTypeDef): boolean {
  if (!def) return false;
  if (role === 'ADMIN' || role === 'OPERATOR') return true;
  if (role === 'FINANCE') return !!def.financial;
  return false;
}
