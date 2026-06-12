import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSession, unauthorized, forbidden, canWrite } from '@/lib/tenant';
import { pad3, ym } from '@/lib/utils';

export async function GET() {
  const session = await apiSession();
  if (!session) return unauthorized();
  const calls = await prisma.portCall.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { createdAt: 'desc' },
    include: { vessel: true, port: true },
  });
  return NextResponse.json(calls);
}

const schema = z.object({
  vesselId: z.string().min(1),
  portId: z.string().min(1),
  voyageNumber: z.string().optional().nullable(),
  eta: z.string().optional().nullable(),
  etd: z.string().optional().nullable(),
  berthName: z.string().optional().nullable(),
  cargoType: z.string().optional().nullable(),
  cargoQuantity: z.number().optional().nullable(),
  cargoUnit: z.string().optional().nullable(),
  shipper: z.string().optional().nullable(),
  consignee: z.string().optional().nullable(),
  charterer: z.string().optional().nullable(),
  principal: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return unauthorized();
  if (!canWrite(session.user.role)) return forbidden();
  try {
    const data = schema.parse(await req.json());
    const companyId = session.user.companyId;

    // Validasi kepemilikan vessel & port
    const [vessel, port] = await Promise.all([
      prisma.vessel.findFirst({ where: { id: data.vesselId, companyId } }),
      prisma.port.findFirst({ where: { id: data.portId, companyId } }),
    ]);
    if (!vessel || !port) return NextResponse.json({ error: 'Vessel/port not found' }, { status: 404 });

    // Nomor referensi: PC-YYYYMM-### per company per bulan
    const period = ym();
    const count = await prisma.portCall.count({
      where: { companyId, callReference: { startsWith: `PC-${period}` } },
    });

    const call = await prisma.portCall.create({
      data: {
        ...data,
        eta: data.eta ? new Date(data.eta) : null,
        etd: data.etd ? new Date(data.etd) : null,
        companyId,
        callReference: `PC-${period}-${pad3(count + 1)}`,
        createdById: session.user.id,
      },
      include: { vessel: true, port: true },
    });
    return NextResponse.json(call, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
