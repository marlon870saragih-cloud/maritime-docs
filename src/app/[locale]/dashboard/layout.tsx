import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Sidebar, type NavItem } from '@/components/layout/Sidebar';
import { TopBarActions } from '@/components/layout/TopBarActions';

export default async function DashboardLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { name: true, subscriptionPlan: true, subscriptionExpiresAt: true },
  });
  if (!company) redirect(`/${locale}/auth/login`);

  const t = await getTranslations('nav');
  const tm = await getTranslations('msg');

  const base = `/${locale}/dashboard`;
  const items: NavItem[] = [
    { href: base, label: t('dashboard') },
    { href: `${base}/port-calls`, label: t('portcalls') },
    { href: '', label: t('documents'), section: true },
    { href: `${base}/documents/new`, label: t('newdoc') },
    { href: `${base}/documents`, label: t('history') },
    { href: '', label: '—', section: true },
    { href: `${base}/vessels`, label: t('vessels') },
    { href: `${base}/crew`, label: t('crew') },
    { href: '', label: t('settings'), section: true },
    { href: `${base}/settings/company`, label: t('company') },
    { href: `${base}/settings/users`, label: t('users') },
    { href: `${base}/settings/billing`, label: t('billing') },
  ];

  // Banner langganan
  const exp = company.subscriptionExpiresAt;
  const daysLeft = exp ? Math.ceil((exp.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;
  const expired = daysLeft !== null && daysLeft <= 0;
  const warning = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

  return (
    <div className="flex min-h-screen">
      <Sidebar items={items} brand={company.name} />
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between border-b border-line px-6 py-3.5 bg-ink2">
          <div className="text-sm text-paperdim">
            {session.user.name}
            <span className="font-mono text-[9px] uppercase tracking-widest text-mute ml-2 border border-line px-1.5 py-0.5">
              {session.user.role}
            </span>
          </div>
          <TopBarActions />
        </header>
        {expired && (
          <div className="bg-port/15 border-b border-port text-port px-6 py-2.5 text-sm font-mono">
            {tm('subExpired')}
          </div>
        )}
        {warning && (
          <div className="bg-warn/15 border-b border-warn text-warn px-6 py-2.5 text-sm font-mono">
            {tm('subWarning', { days: daysLeft })}
          </div>
        )}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
