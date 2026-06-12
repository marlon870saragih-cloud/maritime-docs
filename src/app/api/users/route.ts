import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { apiSession, unauthorized, forbidden } from '@/lib/tenant';

export async function GET() {
  const session = await apiSession();
  if (!session) return unauthorized();
  if (session.user.role !== 'ADMIN') return forbidden();
  const users = await prisma.user.findMany({
    where: { companyId: session.user.companyId },
    select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(users);
}

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'OPERATOR', 'FINANCE', 'VIEWER']),
  tempPassword: z.string().min(8),
});

export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return unauthorized();
  if (session.user.role !== 'ADMIN') return forbidden();
  try {
    const body = schema.parse(await req.json());
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });

    const hash = await bcrypt.hash(body.tempPassword, 10);
    const user = await prisma.user.create({
      data: {
        companyId: session.user.companyId,
        fullName: body.fullName,
        email: body.email,
        role: body.role,
        passwordHash: hash,
      },
      select: { id: true, fullName: true, email: true, role: true, isActive: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
