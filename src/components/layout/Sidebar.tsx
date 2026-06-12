'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  section?: boolean; // pemisah seksi
}

export function Sidebar({ items, brand }: { items: NavItem[]; brand: string }) {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 bg-ink2 border-r border-line min-h-screen p-5 hidden md:block">
      <div className="font-serif text-lg font-semibold mb-8">
        Maritime <em className="text-signal not-italic">Docs</em>
        <div className="font-mono text-[9px] uppercase tracking-widest text-mute mt-1 font-normal truncate">
          {brand}
        </div>
      </div>
      <nav className="space-y-1">
        {items.map((it) =>
          it.section ? (
            <div key={it.label} className="font-mono text-[9px] uppercase tracking-widest text-mute pt-5 pb-1">
              {it.label}
            </div>
          ) : (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'block px-3 py-2 text-sm transition-colors border-l-2',
                pathname === it.href
                  ? 'border-signal text-signal bg-ink3'
                  : 'border-transparent text-paperdim hover:text-paper hover:bg-ink3'
              )}
            >
              {it.label}
            </Link>
          )
        )}
      </nav>
    </aside>
  );
}
