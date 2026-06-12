'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(false);
    const res = await signIn('credentials', { redirect: false, email, password });
    if (res?.error) {
      setErr(true);
      setBusy(false);
    } else {
      router.push(`/${locale}/dashboard`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">{t('email')}</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      </div>
      <div>
        <label className="label">{t('password')}</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {err && <p className="text-port text-sm font-mono">{t('errLogin')}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {t('loginBtn')} →
      </button>
    </form>
  );
}
