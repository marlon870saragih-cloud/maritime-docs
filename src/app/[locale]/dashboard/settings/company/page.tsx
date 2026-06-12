import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CompanyClient } from './company-client';

export default async function CompanySettingsPage() {
  const session = (await getServerSession(authOptions))!;
  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    include: { bankAccounts: true },
  });
  return (
    <CompanyClient
      company={JSON.parse(JSON.stringify(company))}
      isAdmin={session.user.role === 'ADMIN'}
    />
  );
}
