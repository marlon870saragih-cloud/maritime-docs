import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UsersClient } from './users-client';

export default async function UsersSettingsPage({ params: { locale } }: { params: { locale: string } }) {
  const session = (await getServerSession(authOptions))!;
  if (session.user.role !== 'ADMIN') redirect(`/${locale}/dashboard`);

  const users = await prisma.user.findMany({
    where: { companyId: session.user.companyId },
    select: { id: true, fullName: true, email: true, role: true, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  return <UsersClient users={users} selfId={session.user.id} />;
}
