import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProblemeBySlug, getPistesForProbleme } from '@forumeka/db';
import { db } from '@/lib/db';

export default async function DiagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const probleme = await getProblemeBySlug(db, slug);
  if (!probleme) notFound();

  const pistes = await getPistesForProbleme(db, probleme.id);

  return (
    <div>
      <p className="text-sm text-ink-500">{probleme.vehicules.join(' / ')}</p>
      <h1 className="text-xl font-semibold text-ink-900">{probleme.titre}</h1>
      <p className="mt-6 text-ink-700">Pistes connues, classées par taux de succès :</p>

      <ol className="mt-4 space-y-4">
        {pistes.map((piste, i) => (
          <li key={piste.id} className="rounded border border-ink-100 bg-white p-4">
            <p className="text-ink-900">
              {i + 1}. {piste.titre}
            </p>
            <Link
              href={`/piste/${piste.id}`}
              className="mt-2 flex items-center justify-between text-sm text-ink-500 hover:text-ink-900"
            >
              <span>
                📚{' '}
                {piste.threadsTotal === 0
                  ? 'aucun thread'
                  : `${piste.threadsConfirmed} threads sur ${piste.threadsTotal} confirment`}
              </span>
              <span className="text-ink-300">›</span>
            </Link>
            <Link
              href={`/piste/${piste.id}`}
              className="mt-1 flex items-center justify-between text-sm text-ink-500 hover:text-ink-900"
            >
              <span>
                {piste.appTotal === 0
                  ? '⚪ 0 avis app — donner mon retour'
                  : `🟢 ${piste.appWorked} avis app sur ${piste.appTotal} confirment`}
              </span>
              <span className="text-ink-300">›</span>
            </Link>
          </li>
        ))}
      </ol>

      {pistes.length === 0 && (
        <p className="mt-4 text-ink-500">Pas encore de piste indexée pour ce problème.</p>
      )}
    </div>
  );
}
