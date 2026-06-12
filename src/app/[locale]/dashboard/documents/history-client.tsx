'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { DOC_TYPES, getDocType, canWriteDoc } from '@/lib/doc-types-client';
import { downloadPdf } from '@/components/pdf';
import { fmtDate } from '@/lib/utils';

interface Props {
  docs: any[];
  company: any;
  vessels: { id: string; vesselName: string }[];
  role: string;
  filters: { type: string; status: string; vessel: string; q: string };
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'border-mute text-mute',
  FINAL: 'border-good text-good',
  SIGNED: 'border-signal text-signal',
  CANCELLED: 'border-port text-port',
};

export function HistoryClient({ docs, company, vessels, role, filters }: Props) {
  const locale = useLocale();
  const t = useTranslations('doc');
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState(filters);
  const [busyId, setBusyId] = useState('');

  function apply() {
    const qs = new URLSearchParams();
    if (f.type) qs.set('type', f.type);
    if (f.status) qs.set('status', f.status);
    if (f.vessel) qs.set('vessel', f.vessel);
    if (f.q) qs.set('q', f.q);
    router.push(`${pathname}?${qs.toString()}`);
  }

  function pdf(doc: any) {
    const def = getDocType(doc.documentType);
    if (!def) return;
    downloadPdf({
      company,
      banks: company?.bankAccounts || [],
      def,
      data: doc.dataJson,
      number: doc.documentNumber,
      status: doc.status,
    });
  }

  async function finalize(doc: any) {
    setBusyId(doc.id);
    await fetch(`/api/documents/${doc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'FINAL' }),
    });
    setBusyId('');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold">{t('history')}</h1>

      {/* Filter bar */}
      <div className="card flex flex-wrap gap-3 items-end">
        <div className="w-64">
          <label className="label">{t('type')}</label>
          <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            <option value="">{t('allTypes')}</option>
            {DOC_TYPES.map((d) => (
              <option key={d.code} value={d.code}>{locale === 'id' ? d.id : d.en}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="label">{t('status')}</label>
          <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="">{t('allStatus')}</option>
            {['DRAFT', 'FINAL', 'SIGNED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="w-48">
          <label className="label">{t('vessel')}</label>
          <select className="input" value={f.vessel} onChange={(e) => setF({ ...f, vessel: e.target.value })}>
            <option value="">—</option>
            {vessels.map((v) => (
              <option key={v.id} value={v.id}>{v.vesselName}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-44">
          <label className="label">&nbsp;</label>
          <input
            className="input"
            placeholder={t('search')}
            value={f.q}
            onChange={(e) => setF({ ...f, q: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
          />
        </div>
        <button className="btn-primary" onClick={apply}>{t('apply')}</button>
      </div>

      {/* Tabel dokumen */}
      <div className="card !p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">{t('number')}</th>
              <th className="th">{t('type')}</th>
              <th className="th">{t('vessel')}</th>
              <th className="th">{t('date')}</th>
              <th className="th">{t('createdBy')}</th>
              <th className="th">{t('status')}</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 && (
              <tr><td className="td italic text-mute" colSpan={7}>{t('none')}</td></tr>
            )}
            {docs.map((d) => {
              const def = getDocType(d.documentType);
              return (
                <tr key={d.id} className="hover:bg-ink3">
                  <td className="td font-mono text-xs text-signal whitespace-nowrap">{d.documentNumber}</td>
                  <td className="td">{locale === 'id' ? def?.id : def?.en}</td>
                  <td className="td">{d.vessel?.vesselName ?? '-'}</td>
                  <td className="td whitespace-nowrap">{fmtDate(d.createdAt, locale)}</td>
                  <td className="td">{d.createdBy?.fullName ?? '-'}</td>
                  <td className="td"><span className={`badge ${STATUS_COLOR[d.status]}`}>{d.status}</span></td>
                  <td className="td whitespace-nowrap">
                    <button className="font-mono text-xs text-signal hover:underline mr-3" onClick={() => pdf(d)}>
                      PDF
                    </button>
                    <Link
                      className="font-mono text-xs text-mute hover:underline mr-3"
                      href={`/${locale}/dashboard/documents/new?from=${d.id}`}
                    >
                      {t('duplicate')}
                    </Link>
                    {d.status === 'DRAFT' && canWriteDoc(role, def) && (
                      <button
                        className="font-mono text-xs text-good hover:underline disabled:opacity-40"
                        disabled={busyId === d.id}
                        onClick={() => finalize(d)}
                      >
                        {t('finalize')}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
