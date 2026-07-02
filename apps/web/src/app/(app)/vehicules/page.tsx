import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export default async function VehiculesPage() {
  const vehicules = await db.execute<{ vehicule: string; n: number }>(sql`
    select v as vehicule, count(distinct p.id)::int as n
    from problemes p, jsonb_array_elements_text(p.vehicules) as v
    group by v
    order by n desc, v asc
  `);

  return (
    <div>
      <Link href="/" className="text-sm text-ink-500 hover:text-blue-700">
        ← Retour
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Véhicules couverts</h1>
      <p className="mt-2 text-ink-700">
        {vehicules.length} véhicule{vehicules.length === 1 ? '' : 's'} avec au moins un problème
        référencé.
      </p>

      <ul className="mt-6 divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white shadow-sm">
        {vehicules.map((v) => (
          <li key={v.vehicule}>
            <Link
              href={`/recherche?q=${encodeURIComponent(v.vehicule)}`}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-ink-50"
            >
              <span className="text-ink-900">{v.vehicule}</span>
              <span className="shrink-0 text-ink-400">
                {v.n} problème{v.n === 1 ? '' : 's'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
