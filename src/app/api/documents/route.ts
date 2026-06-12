import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSession, unauthorized, forbidden, canWrite } from '@/lib/tenant';
import { getDocType } from '@/lib/doc-types';
import { pad3, ym } from '@/lib/utils';

export async function GET() {
  const session = await apiSession();
  if (!session) return unauthorized();
  const docs = await prisma.document.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { createdAt: 'desc' },
    include: { vessel: { select: { vesselName: true } } },
  });
  return NextResponse.json(docs);
}

const schema = z.object({
  documentType: z.string().min(1),
  portCallId: z.string().optional().nullable(),
  vesselId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'FINAL']).default('DRAFT'),
  dataJson: z.record(z.any()),
});

export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return unauthorized();

  try {
    const body = schema.parse(await req.json());
    const def = getDocType(body.documentType);
    if (!def) return NextResponse.json({ error: 'Tipe dokumen tidak dikenal.' }, { status: 400 });

    // FINANCE hanya boleh dokumen finansial; VIEWER tidak boleh sama sekali
    if (!canWrite(session.user.role, def.financial)) return forbidden();

    const companyId = session.user.companyId;

    // Gate langganan: blok pembuatan dokumen baru jika expired
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { subscriptionExpiresAt: true },
    });
    if (company?.subscriptionExpiresAt && company.subscriptionExpiresAt < new Date()) {
      return NextResponse.json({ error: 'subscription_expired' }, { status: 402 });
    }

    // Validasi kepemilikan relasi
    if (body.portCallId) {
      const pc = await prisma.portCall.findFirst({ where: { id: body.portCallId, companyId } });
      if (!pc) return NextResponse.json({ error: 'Port call not found' }, { status: 404 });
    }
    if (body.vesselId) {
      const v = await prisma.vessel.findFirst({ where: { id: body.vesselId, companyId } });
      if (!v) return NextResponse.json({ error: 'Vessel not found' }, { status: 404 });
    }

    // Penomoran: KODE-YYYYMM-### per company per tipe per bulan
    const period = ym();
    const count = await prisma.document.count({
      where: { companyId, documentType: def.code, documentNumber: { startsWith: `${def.code}-${period}` } },
    });

    const doc = await prisma.document.create({
      data: {
        companyId,
        portCallId: body.portCallId || null,
        vesselId: body.vesselId || null,
        documentType: def.code,
        documentNumber: `${def.code}-${period}-${pad3(count + 1)}`,
        status: body.status,
        dataJson: body.dataJson,
        createdById: session.user.id,
      },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
