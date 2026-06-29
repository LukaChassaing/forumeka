import Link from 'next/link';
import { searchProblemes } from '@forumeka/db';
import { db } from '@/lib/db';

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const results = query ? await searchProblemes(db, query) : [];

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-wide text-ink-500">Recherche</p>
      <h1 className="mt-1 text-2xl font-bold text-ink-900">« {query} »</h1>

      {results.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-ink-200 bg-white p-6 text-center">
          <p className="text-ink-700">Aucune piste connue pour l&apos;instant.</p>
          <p className="mt-1 text-sm text-ink-500">
            Cette base s&apos;enrichit en continu à partir des forums automobiles.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-ink-700">
            <span className="font-semibold text-ink-900">{results.length}</span> problème
            {results.length === 1 ? '' : 's'} trouvé{results.length === 1 ? '' : 's'} sur les forums
            :
          </p>

          <ul className="mt-4 space-y-3">
            {results.map((p) => (
              <li key={p.id} className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm">
                <Link href={`/diag/${p.slug}`} className="group flex items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-lg text-beige-50">
                    🔧
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-ink-900 group-hover:text-blue-700">{p.titre}</p>
                    <p className="mt-1 text-sm text-ink-500">
                      Véhicule : {p.vehicules.join(' / ')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-ink-100 px-3 py-1 text-sm font-medium text-ink-700">
                    {p.nbPistes} piste{p.nbPistes === 1 ? '' : 's'}
                  </span>
                  <span className="shrink-0 text-ink-300 group-hover:text-ink-500">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
