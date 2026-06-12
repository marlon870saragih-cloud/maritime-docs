'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const ROLES = ['ADMIN', 'OPERATOR', 'FINANCE', 'VIEWER'];
const EMPTY = { fullName: '', email: '', role: 'OPERATOR', tempPassword: '' };

export function UsersClient({ users, selfId }: { users: any[]; selfId: string }) {
  const t = useTranslations('settings');
  const ta = useTranslations('auth');
  const tact = useTranslations('action');
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  async function invite() {
    setBusy(true);
    setErr('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || 'Error');
      return;
    }
    setForm(null);
    router.refresh();
  }

  async function update(id: string, data: any) {
    await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">{t('usersTitle')}</h1>
        <button className="btn-primary" onClick={() => setForm({ ...EMPTY })}>+ {t('invite')}</button>
      </div>

      {form && (
        <div className="card grid md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="label">{ta('fullName')}</label>
            <input className="input" value={form.fullName} onChange={set('fullName')} />
          </div>
          <div>
            <label className="label">{ta('email')}</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label">{t('role')}</label>
            <select className="input" value={form.role} onChange={set('role')}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('tempPassword')}</label>
            <input className="input" value={form.tempPassword} onChange={set('tempPassword')} placeholder="min. 8 karakter" />
          </div>
          <div className="md:col-span-4 flex gap-3 items-center">
            <button className="btn-primary" disabled={busy || !form.fullName || !form.email || form.tempPassword.length < 8} onClick={invite}>
              {tact('save')}
            </button>
            <button className="btn-ghost" onClick={() => setForm(null)}>{tact('cancel')}</button>
            {err && <span className="font-mono text-xs text-port">{err}</span>}
          </div>
        </div>
      )}

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">{ta('fullName')}</th>
              <th className="th">{ta('email')}</th>
              <th className="th">{t('role')}</th>
              <th className="th">{t('activeStatus')}</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === selfId;
              return (
                <tr key={u.id} className={`hover:bg-ink3 ${u.isActive ? '' : 'opacity-50'}`}>
                  <td className="td font-medium text-paper">
                    {u.fullName} {isSelf && <span className="font-mono text-[9px] text-signal">(you)</span>}
                  </td>
                  <td className="td">{u.email}</td>
                  <td className="td">
                    <select
                      className="input !py-1.5 !w-36"
                      value={u.role}
                      disabled={isSelf}
                      onChange={(e) => update(u.id, { role: e.target.value })}
                    >
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="td">
                    <span className={`badge ${u.isActive ? 'border-good text-good' : 'border-port text-port'}`}>
                      {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="td">
                    {!isSelf && (
                      <button
                        className="font-mono text-xs text-mute hover:text-port hover:underline"
                        onClick={() => update(u.id, { isActive: !u.isActive })}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
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
