import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSubForumProgress } from '@forumeka/db';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { isAdminEmail } from '@/lib/admin';

function formatDateFr(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateTimeFr(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default async function AdminPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) notFound();

  const progress = await getSubForumProgress(db);
  const byForum = new Map<string, typeof progress>();
  for (const row of progress) {
    if (!byForum.has(row.forum)) byForum.set(row.forum, []);
    byForum.get(row.forum)!.push(row);
  }

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-wide text-ink-500">Admin</p>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Indexation</h1>
        <Link href="/admin/traitements" className="text-sm text-blue-700 hover:underline">
          Voir les traitements →
        </Link>
      </div>

      <div className="mt-6 space-y-6">
        {[...byForum.entries()].map(([forum, subforums]) => (
          <div key={forum} className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${forum}&sz=32`}
                alt=""
                className="h-5 w-5"
              />
              <p className="font-semibold text-ink-900">{forum}</p>
            </div>
            <ul className="mt-3 divide-y divide-ink-100">
              {subforums.map((s) => {
                const pct = s.discovered === 0 ? 0 : Math.round((s.ingested / s.discovered) * 100);
                return (
                  <li key={s.subForumLabel} className="py-2">
                    <Link
                      href={`/admin/sous-forum?forum=${encodeURIComponent(forum)}&label=${encodeURIComponent(s.subForumLabel)}`}
                      className="flex items-center justify-between gap-3 hover:text-blue-700"
                    >
                      <span>{s.subForumLabel}</span>
                      <span className="text-sm text-ink-500">
                        {pct}% — {s.ingested}/{s.discovered} threads — du{' '}
                        {formatDateFr(s.oldestThreadDate)} au {formatDateFr(new Date().toISOString().slice(0, 10))}
                      </span>
                    </Link>
                    {s.lastDiscoverRun && (
                      <p className="mt-1 text-xs text-ink-400">
                        Dernier scan : {s.lastDiscoverRun.threadsFound} threads sur{' '}
                        {s.lastDiscoverRun.pagesScanned} pages, le {formatDateTimeFr(s.lastDiscoverRun.ranAt)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {progress.length === 0 && <p className="mt-4 text-ink-500">Aucune donnée de crawl pour l’instant.</p>}
    </div>
  );
}
