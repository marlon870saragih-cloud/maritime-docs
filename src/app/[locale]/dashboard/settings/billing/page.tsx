import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fmtDate } from '@/lib/utils';

const PLANS = [
  ['Trial', 'Gratis · 14 hari', '2 user · 3 kapal · 50 dok/bln'],
  ['Basic', 'Rp 299.000/bln', '5 user · 10 kapal · 200 dok/bln'],
  ['Pro', 'Rp 599.000/bln', '15 user · 50 kapal · unlimited'],
  ['Enterprise', 'Custom', 'Unlimited semua'],
];

export default async function BillingPage({ params: { locale } }: { params: { locale: string } }) {
  const session = (await getServerSession(authOptions))!;
  const t = await getTranslations('settings');
  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { subscriptionPlan: true, subscriptionExpiresAt: true },
  });

  const exp = company?.subscriptionExpiresAt;
  const daysLeft = exp ? Math.max(0, Math.ceil((exp.getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-serif text-2xl font-semibold">{t('billingTitle')}</h1>

      <div className="card flex flex-wrap gap-10">
        <div>
          <div className="label">{t('plan')}</div>
          <div className="font-serif text-3xl font-semibold text-signal uppercase">{company?.subscriptionPlan}</div>
        </div>
        <div>
          <div className="label">{t('expires')}</div>
          <div className="font-serif text-3xl font-semibold">{fmtDate(exp, locale)}</div>
          {daysLeft !== null && (
            <div className="font-mono text-xs text-mute mt-1">{daysLeft} {t('daysLeft')}</div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {PLANS.map(([name, price, desc]) => (
          <div key={name} className={`card ${company?.subscriptionPlan === name.toLowerCase() ? 'border-signal' : ''}`}>
            <div className="font-mono text-[10px] uppercase tracking-widest text-mute">{name}</div>
            <div className="font-serif text-lg font-semibold mt-1">{price}</div>
            <div className="text-xs text-paperdim mt-2">{desc}</div>
          </div>
        ))}
      </div>

      <p className="text-sm text-mute">{t('billingNote')}</p>
    </div>
  );
}
