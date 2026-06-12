import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fmtDate } from '@/lib/utils';
import { getDocType } from '@/lib/doc-types';

export default async function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const session = (await getServerSession(authOptions))!;
  const companyId = session.user.companyId;
  const t = await getTranslations('dash');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [docsToday, activeCalls, activeVessels, totalDocs, recentDocs, portCalls] = await Promise.all([
    prisma.document.count({ where: { companyId, createdAt: { gte: todayStart } } }),
    prisma.portCall.count({ where: { companyId, status: 'ACTIVE' } }),
    prisma.vessel.count({ where: { companyId, isActive: true } }),
    prisma.document.count({ where: { companyId } }),
    prisma.document.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { vessel: { select: { vesselName: true } } },
    }),
    prisma.portCall.findMany({
      where: { companyId, status: 'ACTIVE' },
      orderBy: { eta: 'asc' },
      take: 5,
      include: { vessel: { select: { vesselName: true } }, port: { select: { portName: true } } },
    }),
  ]);

  const stats = [
    { label: t('docsToday'), value: docsToday },
    { label: t('activeCalls'), value: activeCalls },
    { label: t('activeVessels'), value: activeVessels },
    { label: t('totalDocs'), value: totalDocs },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold">
        {t('welcome')}, {session.user.name}
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="font-mono text-[10px] uppercase tracking-widest text-mute">{s.label}</div>
            <div className="font-serif text-4xl font-semibold mt-2 text-signal">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-serif text-lg font-medium mb-4">{t('recentDocs')}</h2>
          {recentDocs.length === 0 ? (
            <p className="text-mute text-sm italic">{t('noData')}</p>
          ) : (
            <div className="space-y-2">
              {recentDocs.map((d) => {
                const def = getDocType(d.documentType);
                return (
                  <Link
                    key={d.id}
                    href={`/${locale}/dashboard/documents`}
                    className="flex justify-between items-center border border-line px-3 py-2.5 hover:border-signal"
                  >
                    <div>
                      <div className="font-mono text-xs text-signal">{d.documentNumber}</div>
                      <div className="text-sm text-paperdim">
                        {locale === 'id' ? def?.id : def?.en} · {d.vessel?.vesselName ?? '-'}
                      </div>
                    </div>
                    <span className="badge border-line2 text-mute">{d.status}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-serif text-lg font-medium mb-4">{t('activePortCalls')}</h2>
          {portCalls.length === 0 ? (
            <p className="text-mute text-sm italic">{t('noData')}</p>
          ) : (
            <div className="space-y-2">
              {portCalls.map((pc) => (
                <div key={pc.id} className="border border-line px-3 py-2.5">
                  <div className="font-mono text-xs text-signal">{pc.callReference}</div>
                  <div className="text-sm text-paperdim">
                    {pc.vessel.vesselName} · {pc.port.portName} · ETA {fmtDate(pc.eta, locale)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
