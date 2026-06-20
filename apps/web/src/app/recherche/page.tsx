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
      <h1 className="text-xl font-semibold text-ink-900">Résultats pour « {query} »</h1>
      {results.length === 0 && (
        <p className="mt-4 text-ink-500">
          Aucune piste connue pour l&apos;instant. Cette base s&apos;enrichit en continu.
        </p>
      )}
      <ul className="mt-6 divide-y divide-ink-100">
        {results.map((p) => (
          <li key={p.id}>
            <Link href={`/diag/${p.slug}`} className="flex items-center justify-between py-4">
              <div>
                <p className="text-ink-900">{p.titre}</p>
                <p className="text-sm text-ink-500">{p.vehicules.join(' / ')}</p>
              </div>
              <span className="text-ink-300">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
