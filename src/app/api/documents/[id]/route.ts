import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSession, unauthorized, forbidden, canWrite } from '@/lib/tenant';
import { getDocType } from '@/lib/doc-types';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return unauthorized();

  const existing = await prisma.document.findFirst({
    where: { id: params.id, companyId: session.user.companyId },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const def = getDocType(existing.documentType);
  if (!canWrite(session.user.role, def?.financial)) return forbidden();

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if ('status' in body && ['DRAFT', 'FINAL', 'SIGNED', 'CANCELLED'].includes(body.status)) {
    data.status = body.status;
  }
  if ('dataJson' in body && typeof body.dataJson === 'object') {
    data.dataJson = body.dataJson;
  }

  const doc = await prisma.document.update({ where: { id: params.id }, data });
  return NextResponse.json(doc);
}
