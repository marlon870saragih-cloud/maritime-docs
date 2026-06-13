import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSession, unauthorized, forbidden } from '@/lib/tenant';

export async function GET() {
  const session = await apiSession();
  if (!session) return unauthorized();
  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    include: { bankAccounts: true },
  });
  return NextResponse.json(company);
}

const bankSchema = z.object({
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  holderName: z.string().min(1),
  branch: z.string().optional().nullable(),
  swiftCode: z.string().optional().nullable(),
  currency: z.enum(['IDR', 'USD']),
  isDefault: z.boolean().default(false),
});

const schema = z.object({
  name: z.string().min(2),
  alias: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  fax: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  emailOps: z.string().optional().nullable(),
  emailFinance: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  npwp: z.string().optional().nullable(),
  siup: z.string().optional().nullable(),
  nib: z.string().optional().nullable(),
  skKemenkumham: z.string().optional().nullable(),
  siuppak: z.string().optional().nullable(),
  signerName: z.string().optional().nullable(),
  signerTitle: z.string().optional().nullable(),
  pdfTheme: z.enum(['navy', 'green', 'maroon', 'slate']).optional(),
  logoData: z.string().max(1_400_000).optional().nullable(), // base64 ~1MB
  bankAccounts: z.array(bankSchema).default([]),
});

export async function PUT(req: Request) {
  const session = await apiSession();
  if (!session) return unauthorized();
  if (session.user.role !== 'ADMIN') return forbidden();

  try {
    const { bankAccounts, ...profile } = schema.parse(await req.json());
    const companyId = session.user.companyId;

    // Profil + replace seluruh rekening bank dalam satu transaksi
    await prisma.$transaction([
      prisma.company.update({ where: { id: companyId }, data: { ...profile, country: profile.country ?? 'Indonesia' } }),
      prisma.bankAccount.deleteMany({ where: { companyId } }),
      prisma.bankAccount.createMany({
        data: bankAccounts.map((b) => ({ ...b, companyId })),
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
