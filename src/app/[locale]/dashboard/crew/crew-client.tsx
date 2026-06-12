'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const EMPTY = {
  vesselId: '', fullName: '', rank: '', nationality: 'Indonesia',
  passportNumber: '', seamanBook: '', signOnDate: '', signOffDate: '',
};

export function CrewClient({ crew, vessels, role }: { crew: any[]; vessels: any[]; role: string }) {
  const t = useTranslations('crew');
  const ta = useTranslations('action');
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [filterVessel, setFilterVessel] = useState('');
  const [busy, setBusy] = useState(false);
  const writable = role === 'ADMIN' || role === 'OPERATOR';

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });
  const list = filterVessel ? crew.filter((c) => c.vesselId === filterVessel) : crew;

  async function save() {
    setBusy(true);
    const payload: any = { ...form };
    const id = payload.id;
    delete payload.id;
    delete payload.vessel;
    delete payload.isActive;
    const res = await fetch(id ? `/api/crew/${id}` : '/api/crew', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) {
      setForm(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-serif text-2xl font-semibold">{t('title')}</h1>
        <div className="flex gap-3">
          <select className="input !w-56" value={filterVessel} onChange={(e) => setFilterVessel(e.target.value)}>
            <option value="">{t('allVessels')}</option>
            {vessels.map((v) => (
              <option key={v.id} value={v.id}>{v.vesselName}</option>
            ))}
          </select>
          {writable && (
            <button className="btn-primary" onClick={() => setForm({ ...EMPTY, vesselId: filterVessel || vessels[0]?.id || '' })}>
              + {t('add')}
            </button>
          )}
        </div>
      </div>

      {form && (
        <div className="card">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">{t('vessel')}</label>
              <select className="input" value={form.vesselId} onChange={set('vesselId')}>
                {vessels.map((v) => (
                  <option key={v.id} value={v.id}>{v.vesselName}</option>
                ))}
              </select>
            </div>
            {[
              ['fullName', t('name'), 'text'], ['rank', t('rank'), 'text'],
              ['nationality', t('nationality'), 'text'], ['passportNumber', t('passport'), 'text'],
              ['seamanBook', t('seamanBook'), 'text'], ['signOnDate', t('signOn'), 'date'],
              ['signOffDate', t('signOff'), 'date'],
            ].map(([k, label, type]) => (
              <div key={k}>
                <label className="label">{label}</label>
                <input
                  className="input"
                  type={type}
                  value={type === 'date' ? (form[k] || '').slice(0, 10) : form[k] ?? ''}
                  onChange={set(k)}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-5">
            <button className="btn-primary" disabled={busy || !form.fullName || !form.vesselId} onClick={save}>
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
              <th className="th">{t('rank')}</th>
              <th className="th">{t('vessel')}</th>
              <th className="th">{t('nationality')}</th>
              <th className="th">{t('passport')}</th>
              <th className="th">{t('seamanBook')}</th>
              <th className="th">{t('signOn')}</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="hover:bg-ink3">
                <td className="td font-medium text-paper">{c.fullName}</td>
                <td className="td">{c.rank ?? '-'}</td>
                <td className="td">{c.vessel?.vesselName ?? '-'}</td>
                <td className="td">{c.nationality ?? '-'}</td>
                <td className="td font-mono text-xs">{c.passportNumber ?? '-'}</td>
                <td className="td font-mono text-xs">{c.seamanBook ?? '-'}</td>
                <td className="td">{c.signOnDate ? String(c.signOnDate).slice(0, 10) : '-'}</td>
                <td className="td">
                  {writable && (
                    <button
                      className="font-mono text-xs text-signal hover:underline"
                      onClick={() =>
                        setForm({
                          ...EMPTY,
                          ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v ?? ''])),
                          signOnDate: c.signOnDate ? String(c.signOnDate).slice(0, 10) : '',
                          signOffDate: c.signOffDate ? String(c.signOffDate).slice(0, 10) : '',
                        })
                      }
                    >
                      {ta('edit')}
                    </button>
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
