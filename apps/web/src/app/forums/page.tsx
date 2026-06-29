import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '#';
  }
}

export default async function ForumsPage() {
  const forums = await db.execute<{ forum: string; n: number; sampleUrl: string }>(sql`
    select forum, count(*)::int as n, min(url) as "sampleUrl"
    from threads
    group by forum
    order by n desc
  `);

  return (
    <div>
      <Link href="/" className="text-sm text-ink-500 hover:text-blue-700">
        ← Retour
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Forums sourcés</h1>
      <p className="mt-2 text-ink-700">
        {forums.length} forum{forums.length === 1 ? '' : 's'} indexé{forums.length === 1 ? '' : 's'}
        .
      </p>

      <ul className="mt-6 divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white shadow-sm">
        {forums.map((f) => (
          <li key={f.forum}>
            <a
              href={originOf(f.sampleUrl)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${f.forum}&sz=32`}
                alt=""
                className="h-5 w-5"
              />
              <span className="flex-1 text-sm font-medium text-ink-900 hover:text-blue-700">
                {f.forum}
              </span>
              <span className="shrink-0 text-sm text-ink-400">
                {f.n} thread{f.n === 1 ? '' : 's'}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
