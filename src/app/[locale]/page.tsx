import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { DOC_TYPES } from '@/lib/doc-types';

const PLANS = [
  { name: 'Basic', price: 'Rp 299.000', users: '5', vessels: '10', docs: '200' },
  { name: 'Pro', price: 'Rp 599.000', users: '15', vessels: '50', docs: '∞' },
  { name: 'Enterprise', price: 'Custom', users: '∞', vessels: '∞', docs: '∞' },
];

export default async function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('landing');
  const docCount = DOC_TYPES.length; // dihitung otomatis dari registry — selalu akurat

  return (
    <main className="min-h-screen">
      {/* NAV */}
      <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <div className="font-serif text-xl font-semibold">
          Maritime <em className="text-signal not-italic">Docs</em>
        </div>
        <div className="flex gap-3">
          <Link href={`/${locale}/auth/login`} className="btn-ghost">{t('ctaLogin')}</Link>
          <Link href={`/${locale}/auth/register`} className="btn-primary">{t('cta')}</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="font-serif text-5xl md:text-6xl font-semibold leading-tight max-w-3xl mx-auto">
          {t('tagline')}
        </h1>
        <p className="text-paperdim mt-6 max-w-2xl mx-auto leading-relaxed">{t('sub', { count: docCount })}</p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href={`/${locale}/auth/register`} className="btn-primary">{t('cta')} →</Link>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-5">
          {t('f1t', { count: docCount })} · ID/EN · PDF
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-serif text-3xl font-medium text-center mb-12">{t('featuresTitle')}</h2>
        <div className="grid md:grid-cols-4 gap-px bg-line border border-line">
          {([1, 2, 3, 4] as const).map((i) => (
            <div key={i} className="bg-ink p-7">
              <div className="font-mono text-signal text-2xl mb-4">0{i}</div>
              <h3 className="font-serif text-lg font-medium mb-2">{t(`f${i}t`, { count: docCount })}</h3>
              <p className="text-sm text-paperdim leading-relaxed">{t(`f${i}d`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-serif text-3xl font-medium text-center mb-12">{t('pricingTitle')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((p) => (
            <div key={p.name} className={`card ${p.name === 'Pro' ? 'border-signal' : ''}`}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-mute">{p.name}</div>
              <div className="font-serif text-3xl font-semibold mt-2">
                {p.price}
                {p.price !== 'Custom' && <span className="text-sm text-mute font-sans">{t('perMonth')}</span>}
              </div>
              <ul className="mt-6 space-y-2 text-sm text-paperdim">
                <li>{p.users} {t('usersN')}</li>
                <li>{p.vessels} {t('vesselsN')}</li>
                <li>{p.docs} {t('docsPerMonth')}</li>
              </ul>
              <Link href={`/${locale}/auth/register`} className="btn-ghost w-full mt-8">{t('cta')}</Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center font-mono text-[10px] uppercase tracking-widest text-mute">
        © 2026 Maritime Docs
      </footer>
    </main>
  );
}
