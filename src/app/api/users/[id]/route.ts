import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSession, unauthorized, forbidden } from '@/lib/tenant';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return unauthorized();
  if (session.user.role !== 'ADMIN') return forbidden();

  const existing = await prisma.user.findFirst({
    where: { id: params.id, companyId: session.user.companyId },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  // Guard: admin tidak bisa menurunkan role / menonaktifkan dirinya sendiri
  const isSelf = params.id === session.user.id;
  if ('role' in body && ['ADMIN', 'OPERATOR', 'FINANCE', 'VIEWER'].includes(body.role)) {
    if (isSelf) return NextResponse.json({ error: 'Tidak bisa mengubah role sendiri.' }, { status: 400 });
    data.role = body.role;
  }
  if ('isActive' in body) {
    if (isSelf) return NextResponse.json({ error: 'Tidak bisa menonaktifkan diri sendiri.' }, { status: 400 });
    data.isActive = !!body.isActive;
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, fullName: true, email: true, role: true, isActive: true },
  });
  return NextResponse.json(user);
}
