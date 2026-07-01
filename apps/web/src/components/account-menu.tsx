'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { logout } from '@/lib/actions';

export function AccountMenu({
  label,
  email,
  subscribed,
}: {
  label: string;
  email: string | null;
  subscribed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex items-center gap-1.5 rounded-lg border border-transparent py-1 pl-1 pr-2 hover:border-ink-100 hover:bg-ink-50"
      >
        <span className="text-sm font-medium text-ink-700 group-hover:text-ink-900">
          {subscribed ? 'Premium' : 'Mon compte'}
        </span>
        <span
          className={`text-[10px] text-ink-400 transition-transform group-hover:text-ink-700 ${open ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      <div
        role="menu"
        className={`absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-xl border border-ink-100 bg-white py-2 shadow-lg transition duration-150 ${
          open
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium text-ink-900">{label}</p>
          {email && email !== label && (
            <p className="truncate text-xs italic text-ink-500">{email}</p>
          )}
        </div>
        <div className="my-1 border-t border-ink-100" />
        <Link
          href="/compte"
          role="menuitem"
          onClick={() => setOpen(false)}
          className="flex items-center justify-between px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
        >
          Compte et abonnement
          <span className="text-xs text-ink-400">{subscribed ? 'Premium' : 'Gratuit'}</span>
        </Link>
        <div className="my-1 border-t border-ink-100" />
        <form action={logout}>
          <button
            type="submit"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-ink-50"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
