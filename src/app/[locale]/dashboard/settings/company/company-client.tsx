'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type Tab = 'identity' | 'legal' | 'bank';

export function CompanyClient({ company, isAdmin }: { company: any; isAdmin: boolean }) {
  const t = useTranslations('settings');
  const ta = useTranslations('action');
  const tm = useTranslations('msg');
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('identity');
  const [form, setForm] = useState<any>({ ...company });
  const [banks, setBanks] = useState<any[]>(company?.bankAccounts || []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setMsg('Logo terlalu besar (max 1 MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, logoData: reader.result as string });
    reader.readAsDataURL(file);
  }

  async function save() {
    setBusy(true);
    setMsg('');
    const payload = {
      name: form.name, alias: form.alias, address: form.address, city: form.city,
      province: form.province, postalCode: form.postalCode, country: form.country,
      phone: form.phone, fax: form.fax, whatsapp: form.whatsapp,
      emailOps: form.emailOps, emailFinance: form.emailFinance, website: form.website,
      npwp: form.npwp, siup: form.siup, nib: form.nib,
      skKemenkumham: form.skKemenkumham, siuppak: form.siuppak,
      signerName: form.signerName, signerTitle: form.signerTitle,
      logoData: form.logoData,
      bankAccounts: banks.map((b) => ({
        bankName: b.bankName || '', accountNumber: b.accountNumber || '',
        holderName: b.holderName || '', branch: b.branch || null,
        swiftCode: b.swiftCode || null, currency: b.currency || 'IDR',
        isDefault: !!b.isDefault,
      })).filter((b) => b.bankName && b.accountNumber && b.holderName),
    };
    const res = await fetch('/api/companies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    setMsg(res.ok ? tm('saved') : tm('error'));
    if (res.ok) router.refresh();
  }

  const updBank = (i: number, k: string, v: any) => {
    const next = banks.slice();
    next[i] = { ...next[i], [k]: v };
    setBanks(next);
  };

  const TABS: [Tab, string][] = [
    ['identity', t('tabIdentity')],
    ['legal', t('tabLegal')],
    ['bank', t('tabBank')],
  ];

  const field = (k: string, label: string, span2 = false) => (
    <div key={k} className={span2 ? 'md:col-span-2' : ''}>
      <label className="label">{label}</label>
      <input className="input" value={form[k] ?? ''} onChange={set(k)} disabled={!isAdmin} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold">{t('companyTitle')}</h1>
        <p className="text-mute text-sm mt-1">{t('companyDesc')}</p>
      </div>

      <div className="flex border border-line">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 font-mono text-[11px] uppercase tracking-widest py-3 ${
              tab === k ? 'bg-signal text-ink font-bold' : 'text-mute hover:text-paper'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'identity' && (
        <div className="card grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">{t('uploadLogo')}</label>
            <div className="flex items-center gap-4">
              {form.logoData && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoData} alt="logo" className="h-16 w-16 object-contain bg-white p-1" />
              )}
              {isAdmin && <input type="file" accept=".png,.jpg,.jpeg" onChange={onLogo} className="text-sm text-mute" />}
            </div>
          </div>
          {field('name', t('name'))}
          {field('alias', t('alias'))}
          {field('address', t('address'), true)}
          {field('city', t('city'))}
          {field('province', t('province'))}
          {field('postalCode', t('postal'))}
          {field('country', t('country'))}
          {field('phone', t('phone'))}
          {field('fax', t('fax'))}
          {field('whatsapp', t('wa'))}
          {field('emailOps', t('emailOps'))}
          {field('emailFinance', t('emailFin'))}
          {field('website', t('website'))}
        </div>
      )}

      {tab === 'legal' && (
        <div className="card grid md:grid-cols-2 gap-4">
          {field('npwp', t('npwp'))}
          {field('siup', t('siup'))}
          {field('nib', t('nib'))}
          {field('skKemenkumham', t('sk'))}
          {field('siuppak', t('siuppak'))}
          {field('signerName', t('signer'))}
          {field('signerTitle', t('signerTitle'))}
        </div>
      )}

      {tab === 'bank' && (
        <div className="card space-y-3">
          {banks.map((b, i) => (
            <div key={i} className="grid md:grid-cols-7 gap-2 items-end border-b border-line pb-3">
              <div className="md:col-span-2">
                <label className="label">{t('bankName')}</label>
                <input className="input !py-2" value={b.bankName ?? ''} onChange={(e) => updBank(i, 'bankName', e.target.value)} disabled={!isAdmin} />
              </div>
              <div className="md:col-span-2">
                <label className="label">{t('accountNumber')}</label>
                <input className="input !py-2" value={b.accountNumber ?? ''} onChange={(e) => updBank(i, 'accountNumber', e.target.value)} disabled={!isAdmin} />
              </div>
              <div className="md:col-span-2">
                <label className="label">{t('holder')}</label>
                <input className="input !py-2" value={b.holderName ?? ''} onChange={(e) => updBank(i, 'holderName', e.target.value)} disabled={!isAdmin} />
              </div>
              <div>
                <label className="label">{t('currency')}</label>
                <select className="input !py-2" value={b.currency ?? 'IDR'} onChange={(e) => updBank(i, 'currency', e.target.value)} disabled={!isAdmin}>
                  <option>IDR</option>
                  <option>USD</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">SWIFT</label>
                <input className="input !py-2" value={b.swiftCode ?? ''} onChange={(e) => updBank(i, 'swiftCode', e.target.value)} disabled={!isAdmin} />
              </div>
              <label className="flex items-center gap-2 text-sm text-paperdim pb-2">
                <input type="checkbox" checked={!!b.isDefault} onChange={(e) => updBank(i, 'isDefault', e.target.checked)} disabled={!isAdmin} />
                {t('default')}
              </label>
              {isAdmin && (
                <button className="text-port font-mono text-xs pb-2 text-left" onClick={() => setBanks(banks.filter((_, j) => j !== i))}>
                  ✕ {ta('delete')}
                </button>
              )}
            </div>
          ))}
          {isAdmin && (
            <button className="btn-ghost" onClick={() => setBanks([...banks, { currency: 'IDR' }])}>
              + {t('addBank')}
            </button>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="flex items-center gap-4">
          <button className="btn-primary" disabled={busy} onClick={save}>{ta('save')}</button>
          {msg && <span className="font-mono text-xs text-good">{msg}</span>}
        </div>
      )}
    </div>
  );
}
