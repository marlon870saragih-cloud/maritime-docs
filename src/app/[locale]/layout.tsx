import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import '../globals.css';

export const metadata = {
  title: 'Maritime Docs — Dokumen Maritim dalam Satu Platform',
  description:
    'Buat, simpan, dan cetak 29 jenis dokumen maritim — EPDA, Invoice, NOR, SOF, PKK, RKBM, IMO FAL — sebagai PDF profesional.',
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as any)) notFound();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
