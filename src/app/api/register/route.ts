import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  companyName: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
    }

    const hash = await bcrypt.hash(body.password, 10);
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Company + user admin pertama dalam satu transaksi
    await prisma.company.create({
      data: {
        name: body.companyName,
        subscriptionPlan: 'trial',
        subscriptionExpiresAt: trialEnd,
        users: {
          create: {
            fullName: body.fullName,
            email: body.email,
            passwordHash: hash,
            role: 'ADMIN',
          },
        },
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
