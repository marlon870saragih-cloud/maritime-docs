import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSession, unauthorized, forbidden, canWrite } from '@/lib/tenant';

export async function GET() {
  const session = await apiSession();
  if (!session) return unauthorized();
  const ports = await prisma.port.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { portName: 'asc' },
  });
  return NextResponse.json(ports);
}

const schema = z.object({
  portName: z.string().min(1),
  portCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  locode: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return unauthorized();
  if (!canWrite(session.user.role)) return forbidden();
  try {
    const data = schema.parse(await req.json());
    const port = await prisma.port.create({
      data: { ...data, companyId: session.user.companyId },
    });
    return NextResponse.json(port, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
