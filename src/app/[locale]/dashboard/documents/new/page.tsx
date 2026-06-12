import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DocumentHub } from './document-hub';

export default async function NewDocumentPage({
  searchParams,
}: {
  params: { locale: string };
  searchParams: { from?: string };
}) {
  const session = (await getServerSession(authOptions))!;
  const companyId = session.user.companyId;

  const [company, vessels, portCalls, fromDoc] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, include: { bankAccounts: true } }),
    prisma.vessel.findMany({
      where: { companyId, isActive: true },
      orderBy: { vesselName: 'asc' },
      include: { crewMembers: { where: { isActive: true }, orderBy: { fullName: 'asc' } } },
    }),
    prisma.portCall.findMany({
      where: { companyId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { vessel: true, port: true },
    }),
    searchParams.from
      ? prisma.document.findFirst({ where: { id: searchParams.from, companyId } })
      : Promise.resolve(null),
  ]);

  // Serialisasi aman untuk client component (Date → string)
  const plain = (o: unknown) => JSON.parse(JSON.stringify(o));

  return (
    <DocumentHub
      company={plain(company)}
      vessels={plain(vessels)}
      portCalls={plain(portCalls)}
      fromDoc={fromDoc ? plain(fromDoc) : null}
      role={session.user.role}
    />
  );
}
