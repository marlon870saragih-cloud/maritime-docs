import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

// Session untuk API route — null jika belum login
export async function apiSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return null;
  return session;
}

export const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
export const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 });

// ADMIN & OPERATOR boleh tulis semua; FINANCE hanya dokumen finansial; VIEWER read-only
export function canWrite(role: string, financial = false): boolean {
  if (role === 'ADMIN' || role === 'OPERATOR') return true;
  if (role === 'FINANCE') return financial;
  return false;
}
