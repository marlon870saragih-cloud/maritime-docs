import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PortCallsClient } from './port-calls-client';

export default async function PortCallsPage() {
  const session = (await getServerSession(authOptions))!;
  const companyId = session.user.companyId;
  const [calls, vessels, ports] = await Promise.all([
    prisma.portCall.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: { vessel: { select: { vesselName: true } }, port: { select: { portName: true } } },
    }),
    prisma.vessel.findMany({
      where: { companyId, isActive: true },
      orderBy: { vesselName: 'asc' },
      select: { id: true, vesselName: true },
    }),
    prisma.port.findMany({
      where: { companyId },
      orderBy: { portName: 'asc' },
      select: { id: true, portName: true },
    }),
  ]);
  return (
    <PortCallsClient
      calls={JSON.parse(JSON.stringify(calls))}
      vessels={vessels}
      ports={ports}
      role={session.user.role}
    />
  );
}
