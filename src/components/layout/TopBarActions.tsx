'use client';

import { signOut } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export function TopBarActions() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('nav');

  const toggleLang = () => {
    const next = locale === 'id' ? 'en' : 'id';
    router.push(pathname.replace(`/${locale}`, `/${next}`));
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={toggleLang} className="font-mono text-xs tracking-widest border border-line2 px-3 py-1.5 hover:border-signal">
        {locale === 'id' ? 'EN' : 'ID'}
      </button>
      <button
        onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
        className="font-mono text-[10px] uppercase tracking-widest text-mute hover:text-port px-2 py-1.5"
      >
        {t('logout')}
      </button>
    </div>
  );
}
