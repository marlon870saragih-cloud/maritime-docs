import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSession, unauthorized, forbidden, canWrite } from '@/lib/tenant';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return unauthorized();
  if (!canWrite(session.user.role)) return forbidden();

  const existing = await prisma.crewMember.findFirst({
    where: { id: params.id, companyId: session.user.companyId },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const dateKeys = ['dateOfBirth', 'signOnDate', 'signOffDate'];
  const allowed = [
    'fullName', 'rank', 'nationality', 'passportNumber', 'seamanBook',
    'contractDuration', 'isActive', ...dateKeys,
  ];
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) data[k] = dateKeys.includes(k) && body[k] ? new Date(body[k]) : body[k];
  }

  const crew = await prisma.crewMember.update({ where: { id: params.id }, data });
  return NextResponse.json(crew);
}
