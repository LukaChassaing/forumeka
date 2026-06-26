import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getThreadsForSubForum } from '@forumeka/db';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { isAdminEmail } from '@/lib/admin';

const STATUS_LABEL: Record<string, string> = {
  discovered: 'À traiter',
  processing: 'En cours',
  ingested: 'Ingéré',
  failed: 'Échec',
  skipped: 'Ignoré',
};

export default async function SousForumPage({
  searchParams,
}: {
  searchParams: Promise<{ forum?: string; label?: string }>;
}) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) notFound();

  const { forum, label } = await searchParams;
  if (!forum || !label) notFound();

  const threads = await getThreadsForSubForum(db, forum, label);

  return (
    <div>
      <Link href="/admin" className="text-sm text-ink-500 hover:text-blue-700">
        ← Admin
      </Link>
      <p className="mt-4 text-sm font-medium uppercase tracking-wide text-ink-500">{forum}</p>
      <h1 className="mt-1 text-2xl font-bold text-ink-900">{label}</h1>
      <p className="mt-2 text-ink-500">{threads.length} thread(s) découvert(s)</p>

      <ul className="mt-6 divide-y divide-ink-100">
        {threads.map((t) => (
          <li key={t.threadUrl} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <a
                href={t.threadUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm text-blue-700 hover:underline"
              >
                {t.threadUrl}
              </a>
              <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">
                {STATUS_LABEL[t.status] ?? t.status}
              </span>
            </div>
            {t.status === 'ingested' && (
              <p className="mt-1 text-sm text-ink-500">
                {t.problemesCreated === null ? (
                  'déjà traité, détail indisponible'
                ) : (
                  <>
                    +{t.problemesCreated} nouveau{t.problemesCreated === 1 ? '' : 'x'} problème
                    {t.problemesCreated === 1 ? '' : 's'} trouvé{t.problemesCreated === 1 ? '' : 's'}, +
                    {(t.pistesCreatedNewProbleme ?? 0) + (t.pistesCreatedExistingProbleme ?? 0)}{' '}
                    nouvelle{(t.pistesCreatedNewProbleme ?? 0) + (t.pistesCreatedExistingProbleme ?? 0) === 1 ? '' : 's'}{' '}
                    piste{(t.pistesCreatedNewProbleme ?? 0) + (t.pistesCreatedExistingProbleme ?? 0) === 1 ? '' : 's'} trouvée
                    {(t.pistesCreatedNewProbleme ?? 0) + (t.pistesCreatedExistingProbleme ?? 0) === 1 ? '' : 's'} (+
                    {t.pistesCreatedExistingProbleme ?? 0} pour des problèmes existants, +
                    {t.pistesCreatedNewProbleme ?? 0} pour des nouveaux problèmes)
                  </>
                )}
              </p>
            )}
            {t.status === 'failed' && t.error && (
              <p className="mt-1 text-sm text-red-700">{t.error}</p>
            )}
          </li>
        ))}
      </ul>

      {threads.length === 0 && <p className="mt-4 text-ink-500">Aucun thread pour ce sous-forum.</p>}
    </div>
  );
}
