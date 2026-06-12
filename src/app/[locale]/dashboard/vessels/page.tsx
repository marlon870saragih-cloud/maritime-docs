import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { VesselsClient } from './vessels-client';

export default async function VesselsPage() {
  const session = (await getServerSession(authOptions))!;
  const vessels = await prisma.vessel.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { vesselName: 'asc' },
  });
  return <VesselsClient vessels={JSON.parse(JSON.stringify(vessels))} role={session.user.role} />;
}
