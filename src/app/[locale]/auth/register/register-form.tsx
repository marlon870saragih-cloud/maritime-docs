'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function RegisterForm({ locale }: { locale: string }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [form, setForm] = useState({ companyName: '', fullName: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || t('errRegister'));
      setBusy(false);
      return;
    }
    await signIn('credentials', { redirect: false, email: form.email, password: form.password });
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">{t('companyName')}</label>
        <input className="input" value={form.companyName} onChange={set('companyName')} required autoFocus />
      </div>
      <div>
        <label className="label">{t('fullName')}</label>
        <input className="input" value={form.fullName} onChange={set('fullName')} required />
      </div>
      <div>
        <label className="label">{t('email')}</label>
        <input className="input" type="email" value={form.email} onChange={set('email')} required />
      </div>
      <div>
        <label className="label">{t('password')}</label>
        <input className="input" type="password" value={form.password} onChange={set('password')} minLength={8} required />
      </div>
      {err && <p className="text-port text-sm font-mono">{err}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {t('registerBtn')} →
      </button>
    </form>
  );
}
