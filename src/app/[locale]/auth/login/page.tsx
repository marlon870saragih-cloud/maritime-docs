import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from './login-form';

export default async function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('auth');
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="card w-full max-w-md">
        <h1 className="font-serif text-2xl font-semibold mb-1">{t('loginTitle')}</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-mute mb-8">{t('trialInfo')}</p>
        <LoginForm locale={locale} />
        <Link
          href={`/${locale}/auth/register`}
          className="block text-center text-sm text-mute hover:text-signal mt-6"
        >
          {t('noAccount')}
        </Link>
      </div>
    </main>
  );
}
