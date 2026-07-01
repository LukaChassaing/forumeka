import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export async function BrandSidebar() {
  const topMarques = await db.execute<{ marque: string; n: number }>(sql`
    select split_part(v, ' ', 1) as marque, count(distinct p.id)::int as n
    from problemes p, jsonb_array_elements_text(p.vehicules) as v
    group by marque
    order by n desc
    limit 8
  `);
  if (topMarques.length === 0) return null;

  return (
    <aside className="fixed left-6 top-20 hidden w-56 xl:block">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
        Marques les plus indexées
      </p>
      <ul className="mt-3 space-y-1">
        {topMarques.map((m) => (
          <li key={m.marque}>
            <Link
              href={`/recherche?q=${encodeURIComponent(m.marque)}`}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-ink-700 hover:bg-ink-100 hover:text-ink-900"
            >
              <span className="truncate">{m.marque}</span>
              <span className="shrink-0 text-xs text-ink-400">{m.n}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
