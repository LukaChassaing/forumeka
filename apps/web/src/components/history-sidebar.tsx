import Link from 'next/link';
import { getRecentConsultations } from '@forumeka/db';
import { auth } from '@/auth';
import { db } from '@/lib/db';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export async function HistorySidebar() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const history = await getRecentConsultations(db, session.user.id);
  if (history.length === 0) return null;

  return (
    <aside className="fixed right-6 top-20 hidden w-64 xl:block">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
        Consulté récemment
      </p>
      <ul className="mt-3 space-y-1">
        {history.map((h) => (
          <li key={`${h.type}-${h.refId}`}>
            <Link
              href={h.href}
              className="block rounded-lg px-2 py-1.5 text-sm text-ink-700 hover:bg-ink-100 hover:text-ink-900"
            >
              <span className="block truncate">{h.titre}</span>
              <span className="text-xs text-ink-400">
                {h.type === 'probleme' ? 'Problème' : 'Piste'} · {formatDateTime(h.vuLe)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
