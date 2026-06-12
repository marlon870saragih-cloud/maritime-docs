import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSession, unauthorized, forbidden, canWrite } from '@/lib/tenant';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return unauthorized();
  if (!canWrite(session.user.role)) return forbidden();

  const existing = await prisma.vessel.findFirst({
    where: { id: params.id, companyId: session.user.companyId },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  // Hanya field yang dikenal
  const allowed = [
    'vesselName', 'imoNumber', 'mmsi', 'callSign', 'flag', 'vesselType',
    'grossTonnage', 'netTonnage', 'deadweight', 'loa', 'beam', 'draft',
    'builtYear', 'classification', 'ownerName', 'ownerAddress', 'operatorName',
    'pAndIClub', 'isActive',
  ];
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];

  const vessel = await prisma.vessel.update({ where: { id: params.id }, data });
  return NextResponse.json(vessel);
}
