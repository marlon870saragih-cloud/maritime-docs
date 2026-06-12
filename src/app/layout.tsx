import type { ReactNode } from 'react';

// Root layout pass-through — <html>/<body> ada di [locale]/layout.tsx (pola next-intl)
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
