import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSession, unauthorized, forbidden, canWrite } from '@/lib/tenant';

export async function GET() {
  const session = await apiSession();
  if (!session) return unauthorized();
  const vessels = await prisma.vessel.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { vesselName: 'asc' },
    include: { crewMembers: { where: { isActive: true } } },
  });
  return NextResponse.json(vessels);
}

const schema = z.object({
  vesselName: z.string().min(1),
  imoNumber: z.string().optional().nullable(),
  mmsi: z.string().optional().nullable(),
  callSign: z.string().optional().nullable(),
  flag: z.string().optional().nullable(),
  vesselType: z.string().optional().nullable(),
  grossTonnage: z.number().optional().nullable(),
  netTonnage: z.number().optional().nullable(),
  deadweight: z.number().optional().nullable(),
  loa: z.number().optional().nullable(),
  beam: z.number().optional().nullable(),
  draft: z.number().optional().nullable(),
  builtYear: z.number().int().optional().nullable(),
  classification: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  ownerAddress: z.string().optional().nullable(),
  operatorName: z.string().optional().nullable(),
  pAndIClub: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return unauthorized();
  if (!canWrite(session.user.role)) return forbidden();
  try {
    const data = schema.parse(await req.json());
    const vessel = await prisma.vessel.create({
      data: { ...data, companyId: session.user.companyId },
    });
    return NextResponse.json(vessel, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
