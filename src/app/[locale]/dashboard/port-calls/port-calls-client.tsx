'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { fmtDate } from '@/lib/utils';

const EMPTY = {
  vesselId: '', portId: '', voyageNumber: '', eta: '', etd: '', berthName: '',
  cargoType: '', cargoQuantity: '', cargoUnit: 'MT', shipper: '', consignee: '', principal: '',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'border-good text-good',
  COMPLETED: 'border-mute text-mute',
  CANCELLED: 'border-port text-port',
};

export function PortCallsClient({ calls, vessels, ports, role }: { calls: any[]; vessels: any[]; ports: any[]; role: string }) {
  const t = useTranslations('pc');
  const ta = useTranslations('action');
  const locale = useLocale();
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [newPort, setNewPort] = useState('');
  const [busy, setBusy] = useState(false);
  const writable = role === 'ADMIN' || role === 'OPERATOR';

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  async function save() {
    setBusy(true);
    let portId = form.portId;

    // Buat pelabuhan baru inline jika diisi
    if (newPort.trim()) {
      const res = await fetch('/api/ports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portName: newPort.trim() }),
      });
      if (res.ok) portId = (await res.json()).id;
    }

    const res = await fetch('/api/port-calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        portId,
        cargoQuantity: form.cargoQuantity ? +form.cargoQuantity : null,
        eta: form.eta || null,
        etd: form.etd || null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setForm(null);
      setNewPort('');
      router.refresh();
    }
  }

  async function complete(pc: any) {
    await fetch(`/api/port-calls/${pc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED', atd: new Date().toISOString() }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">{t('title')}</h1>
        {writable && (
          <button className="btn-primary" onClick={() => setForm({ ...EMPTY, vesselId: vessels[0]?.id || '', portId: ports[0]?.id || '' })}>
            + {t('add')}
          </button>
        )}
      </div>

      {form && (
        <div className="card">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">{t('vessel')}</label>
              <select className="input" value={form.vesselId} onChange={set('vesselId')}>
                {vessels.map((v) => <option key={v.id} value={v.id}>{v.vesselName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('port')}</label>
              <select className="input" value={form.portId} onChange={set('portId')} disabled={!!newPort}>
                {ports.map((p) => <option key={p.id} value={p.id}>{p.portName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('newPort')}</label>
              <input className="input" placeholder={t('portName')} value={newPort} onChange={(e) => setNewPort(e.target.value)} />
            </div>
            {[
              ['voyageNumber', t('voyage'), 'text'], ['eta', 'ETA', 'datetime-local'],
              ['etd', 'ETD', 'datetime-local'], ['berthName', t('berth'), 'text'],
              ['cargoType', t('cargo'), 'text'], ['cargoQuantity', 'Qty', 'number'],
              ['cargoUnit', 'Unit', 'text'], ['shipper', t('shipper'), 'text'],
              ['consignee', t('consignee'), 'text'], ['principal', t('principal'), 'text'],
            ].map(([k, label, type]) => (
              <div key={k}>
                <label className="label">{label}</label>
                <input className="input" type={type} value={form[k] ?? ''} onChange={set(k)} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-5">
            <button className="btn-primary" disabled={busy || !form.vesselId || (!form.portId && !newPort)} onClick={save}>
              {ta('save')}
            </button>
            <button className="btn-ghost" onClick={() => { setForm(null); setNewPort(''); }}>{ta('cancel')}</button>
          </div>
        </div>
      )}

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">{t('reference')}</th>
              <th className="th">{t('vessel')}</th>
              <th className="th">{t('port')}</th>
              <th className="th">{t('voyage')}</th>
              <th className="th">ETA</th>
              <th className="th">{t('cargo')}</th>
              <th className="th">{t('status')}</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {calls.map((pc) => (
              <tr key={pc.id} className="hover:bg-ink3">
                <td className="td font-mono text-xs text-signal whitespace-nowrap">{pc.callReference}</td>
                <td className="td font-medium text-paper">{pc.vessel.vesselName}</td>
                <td className="td">{pc.port.portName}</td>
                <td className="td">{pc.voyageNumber ?? '-'}</td>
                <td className="td whitespace-nowrap">{fmtDate(pc.eta, locale)}</td>
                <td className="td">
                  {pc.cargoType ? `${pc.cargoType}${pc.cargoQuantity ? ` ${pc.cargoQuantity} ${pc.cargoUnit ?? ''}` : ''}` : '-'}
                </td>
                <td className="td"><span className={`badge ${STATUS_COLOR[pc.status]}`}>{pc.status}</span></td>
                <td className="td">
                  {writable && pc.status === 'ACTIVE' && (
                    <button className="font-mono text-xs text-good hover:underline" onClick={() => complete(pc)}>
                      ✓ {t('complete')}
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
