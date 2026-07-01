'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader({ accountSlot }: { accountSlot?: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-10 border-b border-ink-100 bg-beige-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-3">
        {!isHome && (
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-ink-900">
            <Image src="/logo.png" alt="" width={28} height={28} className="rounded-md" />
            Forumeka
          </Link>
        )}
        {!isHome && (
          <form action="/recherche" method="get" className="flex flex-1 gap-2">
            <input
              name="q"
              type="text"
              placeholder="Effectuer une nouvelle recherche ?"
              className="w-full rounded border border-ink-100 bg-white px-3 py-1.5 text-sm text-ink-900 outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              className="shrink-0 rounded bg-ink-900 px-3 py-1.5 text-sm font-medium text-beige-50 hover:bg-ink-700"
            >
              Chercher
            </button>
          </form>
        )}
        <div className="ml-auto flex items-center gap-2">
          {accountSlot}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
