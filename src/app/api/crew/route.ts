import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSession, unauthorized, forbidden, canWrite } from '@/lib/tenant';

export async function GET(req: Request) {
  const session = await apiSession();
  if (!session) return unauthorized();
  const vesselId = new URL(req.url).searchParams.get('vesselId');
  const crew = await prisma.crewMember.findMany({
    where: {
      companyId: session.user.companyId,
      ...(vesselId ? { vesselId } : {}),
    },
    orderBy: { fullName: 'asc' },
  });
  return NextResponse.json(crew);
}

const schema = z.object({
  vesselId: z.string().min(1),
  fullName: z.string().min(1),
  rank: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
  seamanBook: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  signOnDate: z.string().optional().nullable(),
  signOffDate: z.string().optional().nullable(),
  contractDuration: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return unauthorized();
  if (!canWrite(session.user.role)) return forbidden();
  try {
    const data = schema.parse(await req.json());

    // Pastikan kapal milik company yang sama
    const vessel = await prisma.vessel.findFirst({
      where: { id: data.vesselId, companyId: session.user.companyId },
    });
    if (!vessel) return NextResponse.json({ error: 'Vessel not found' }, { status: 404 });

    const crew = await prisma.crewMember.create({
      data: {
        ...data,
        companyId: session.user.companyId,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        signOnDate: data.signOnDate ? new Date(data.signOnDate) : null,
        signOffDate: data.signOffDate ? new Date(data.signOffDate) : null,
      },
    });
    return NextResponse.json(crew, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
