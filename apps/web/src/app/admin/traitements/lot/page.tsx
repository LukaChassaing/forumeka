import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getThreadsForBatch } from '@forumeka/db';
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

export default async function LotPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) notFound();

  const { id } = await searchParams;
  if (!id) notFound();

  const threads = await getThreadsForBatch(db, id);

  return (
    <div>
      <Link href="/admin/traitements" className="text-sm text-ink-500 hover:text-blue-700">
        ← Traitements
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Détail du lot</h1>
      <p className="mt-2 text-ink-500">{threads.length} thread(s) traité(s)</p>

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
              <>
                {(t.createdDetail?.problemes.length ?? 0) + (t.createdDetail?.pistes.length ?? 0) >
                0 ? (
                  <details className="mt-1 text-sm text-ink-500">
                    <summary className="cursor-pointer hover:text-blue-700">
                      +{t.problemesCreated ?? 0} problème(s), +
                      {(t.pistesCreatedNewProbleme ?? 0) + (t.pistesCreatedExistingProbleme ?? 0)}{' '}
                      piste(s)
                      {t.inputTokens != null && (
                        <>
                          {' '}
                          — {t.inputTokens.toLocaleString('fr-FR')} tokens entrée,{' '}
                          {t.outputTokens?.toLocaleString('fr-FR')} tokens sortie
                        </>
                      )}
                    </summary>
                    <ul className="mt-1 ml-4 list-disc">
                      {t.createdDetail?.problemes.map((p) => (
                        <li key={p.id}>Nouveau problème : {p.titre}</li>
                      ))}
                      {t.createdDetail?.pistes.map((p) => (
                        <li key={p.id}>Nouvelle piste : {p.titre}</li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <p className="mt-1 text-sm text-ink-500">
                    +{t.problemesCreated ?? 0} problème(s), +
                    {(t.pistesCreatedNewProbleme ?? 0) + (t.pistesCreatedExistingProbleme ?? 0)}{' '}
                    piste(s)
                    {t.inputTokens != null && (
                      <>
                        {' '}
                        — {t.inputTokens.toLocaleString('fr-FR')} tokens entrée,{' '}
                        {t.outputTokens?.toLocaleString('fr-FR')} tokens sortie
                      </>
                    )}
                  </p>
                )}
              </>
            )}
            {t.status === 'failed' && t.error && (
              <p className="mt-1 text-sm text-red-700">{t.error}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
