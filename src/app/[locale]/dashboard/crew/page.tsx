import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CrewClient } from './crew-client';

export default async function CrewPage() {
  const session = (await getServerSession(authOptions))!;
  const companyId = session.user.companyId;
  const [crew, vessels] = await Promise.all([
    prisma.crewMember.findMany({
      where: { companyId },
      orderBy: { fullName: 'asc' },
      include: { vessel: { select: { vesselName: true } } },
    }),
    prisma.vessel.findMany({
      where: { companyId, isActive: true },
      orderBy: { vesselName: 'asc' },
      select: { id: true, vesselName: true },
    }),
  ]);
  return (
    <CrewClient
      crew={JSON.parse(JSON.stringify(crew))}
      vessels={vessels}
      role={session.user.role}
    />
  );
}
