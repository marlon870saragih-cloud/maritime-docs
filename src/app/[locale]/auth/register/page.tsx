import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { RegisterForm } from './register-form';

export default async function RegisterPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('auth');
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="card w-full max-w-md">
        <h1 className="font-serif text-2xl font-semibold mb-1">{t('registerTitle')}</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-mute mb-8">{t('trialInfo')}</p>
        <RegisterForm locale={locale} />
        <Link
          href={`/${locale}/auth/login`}
          className="block text-center text-sm text-mute hover:text-signal mt-6"
        >
          {t('haveAccount')}
        </Link>
      </div>
    </main>
  );
}
