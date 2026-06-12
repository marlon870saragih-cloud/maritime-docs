'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const EMPTY = {
  vesselName: '', vesselType: '', imoNumber: '', flag: 'Indonesia',
  grossTonnage: '', deadweight: '', loa: '', builtYear: '', ownerName: '',
};

export function VesselsClient({ vessels, role }: { vessels: any[]; role: string }) {
  const t = useTranslations('vessels');
  const ta = useTranslations('action');
  const router = useRouter();
  const [form, setForm] = useState<any>(null); // null = tertutup; {id?} = form terbuka
  const [busy, setBusy] = useState(false);
  const writable = role === 'ADMIN' || role === 'OPERATOR';

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  async function save() {
    setBusy(true);
    const payload = {
      ...form,
      grossTonnage: form.grossTonnage ? +form.grossTonnage : null,
      deadweight: form.deadweight ? +form.deadweight : null,
      loa: form.loa ? +form.loa : null,
      builtYear: form.builtYear ? +form.builtYear : null,
    };
    delete payload.id;
    delete payload.isActive;
    const res = await fetch(form.id ? `/api/vessels/${form.id}` : '/api/vessels', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) {
      setForm(null);
      router.refresh();
    }
  }

  async function toggleActive(v: any) {
    await fetch(`/api/vessels/${v.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !v.isActive }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">{t('title')}</h1>
        {writable && (
          <button className="btn-primary" onClick={() => setForm({ ...EMPTY })}>
            + {t('add')}
          </button>
        )}
      </div>

      {form && (
        <div className="card">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              ['vesselName', t('name')], ['vesselType', t('type')], ['imoNumber', t('imo')],
              ['flag', t('flag')], ['grossTonnage', t('gt')], ['deadweight', t('dwt')],
              ['loa', t('loa')], ['builtYear', t('built')], ['ownerName', t('owner')],
            ].map(([k, label]) => (
              <div key={k}>
                <label className="label">{label}</label>
                <input className="input" value={form[k] ?? ''} onChange={set(k)} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-5">
            <button className="btn-primary" disabled={busy || !form.vesselName} onClick={save}>
              {ta('save')}
            </button>
            <button className="btn-ghost" onClick={() => setForm(null)}>{ta('cancel')}</button>
          </div>
        </div>
      )}

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">{t('name')}</th>
              <th className="th">{t('type')}</th>
              <th className="th">{t('imo')}</th>
              <th className="th">{t('flag')}</th>
              <th className="th">{t('gt')}</th>
              <th className="th">{t('dwt')}</th>
              <th className="th">{t('built')}</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {vessels.map((v) => (
              <tr key={v.id} className={`hover:bg-ink3 ${v.isActive ? '' : 'opacity-50'}`}>
                <td className="td font-medium text-paper">{v.vesselName}</td>
                <td className="td">{v.vesselType ?? '-'}</td>
                <td className="td font-mono text-xs">{v.imoNumber ?? '-'}</td>
                <td className="td">{v.flag ?? '-'}</td>
                <td className="td">{v.grossTonnage ?? '-'}</td>
                <td className="td">{v.deadweight ?? '-'}</td>
                <td className="td">{v.builtYear ?? '-'}</td>
                <td className="td whitespace-nowrap">
                  {writable && (
                    <>
                      <button
                        className="font-mono text-xs text-signal hover:underline mr-3"
                        onClick={() => setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(v).map(([k, val]) => [k, val ?? ''])) })}
                      >
                        {ta('edit')}
                      </button>
                      <button className="font-mono text-xs text-mute hover:underline" onClick={() => toggleActive(v)}>
                        {v.isActive ? t('inactive') : t('active')}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
