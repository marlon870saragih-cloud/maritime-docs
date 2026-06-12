import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { HistoryClient } from './history-client';

export default async function DocumentsPage({
  searchParams,
}: {
  params: { locale: string };
  searchParams: { type?: string; status?: string; vessel?: string; q?: string };
}) {
  const session = (await getServerSession(authOptions))!;
  const companyId = session.user.companyId;

  const [docs, company, vessels] = await Promise.all([
    prisma.document.findMany({
      where: {
        companyId,
        ...(searchParams.type ? { documentType: searchParams.type } : {}),
        ...(searchParams.status ? { status: searchParams.status as any } : {}),
        ...(searchParams.vessel ? { vesselId: searchParams.vessel } : {}),
        ...(searchParams.q
          ? { documentNumber: { contains: searchParams.q, mode: 'insensitive' as const } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        vessel: { select: { vesselName: true } },
        createdBy: { select: { fullName: true } },
      },
    }),
    prisma.company.findUnique({ where: { id: companyId }, include: { bankAccounts: true } }),
    prisma.vessel.findMany({ where: { companyId }, orderBy: { vesselName: 'asc' }, select: { id: true, vesselName: true } }),
  ]);

  const plain = (o: unknown) => JSON.parse(JSON.stringify(o));

  return (
    <HistoryClient
      docs={plain(docs)}
      company={plain(company)}
      vessels={plain(vessels)}
      role={session.user.role}
      filters={{
        type: searchParams.type || '',
        status: searchParams.status || '',
        vessel: searchParams.vessel || '',
        q: searchParams.q || '',
      }}
    />
  );
}
