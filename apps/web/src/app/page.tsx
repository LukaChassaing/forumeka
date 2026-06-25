import Image from 'next/image';
import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

const EXEMPLES = [
  'Clio 3 1.5 dCi cale à chaud',
  'Démarreur qui clique sans démarrer',
  'Voyant ESP allumé',
  'Code erreur P0108',
];

export default async function HomePage() {
  const [{ n: nbThreads }] = await db.execute<{ n: string }>(
    sql`select count(*)::int as n from threads`,
  );
  const [{ n: nbForums }] = await db.execute<{ n: string }>(
    sql`select count(distinct forum)::int as n from threads`,
  );
  const [{ n: nbProblemes }] = await db.execute<{ n: string }>(
    sql`select count(*)::int as n from problemes`,
  );
  const [{ n: nbPistes }] = await db.execute<{ n: string }>(
    sql`select count(*)::int as n from pistes`,
  );
  const [{ n: nbVehicules }] = await db.execute<{ n: string }>(
    sql`select count(distinct v)::int as n from problemes, jsonb_array_elements_text(vehicules) as v`,
  );
  const [{ n: nbConfirmees }] = await db.execute<{ n: string }>(
    sql`select count(distinct piste_id)::int as n from thread_piste_mentions where statut_dans_thread = 'confirmed'`,
  );

  const stats = [
    { value: nbThreads, label: 'threads de forum analysés' },
    { value: nbForums, label: `forum${Number(nbForums) === 1 ? '' : 's'} sourcé${Number(nbForums) === 1 ? '' : 's'}` },
    { value: nbProblemes, label: `problème${Number(nbProblemes) === 1 ? '' : 's'} référencé${Number(nbProblemes) === 1 ? '' : 's'}` },
    { value: nbPistes, label: 'pistes de diagnostic' },
    { value: nbVehicules, label: `véhicule${Number(nbVehicules) === 1 ? '' : 's'} couvert${Number(nbVehicules) === 1 ? '' : 's'}` },
    { value: nbConfirmees, label: `piste${Number(nbConfirmees) === 1 ? '' : 's'} confirmée${Number(nbConfirmees) === 1 ? '' : 's'} par les forums` },
  ];

  return (
    <div>
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="Forumeka" width={48} height={48} className="rounded-xl" />
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Forumeka</h1>
          <p className="text-sm text-ink-500">Diagnostic auto collaboratif</p>
        </div>
      </div>

      <p className="mt-6 text-lg text-ink-700">
        La solution à ton problème est forcément quelque part. Il suffit de savoir où chercher.
      </p>

      <form action="/recherche" method="get" className="mt-8">
        <div className="flex gap-2 rounded-xl border border-ink-100 bg-white p-2 shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <div className="flex flex-1 items-center gap-2 px-2">
            <svg
              className="h-5 w-5 shrink-0 text-ink-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z"
              />
            </svg>
            <input
              name="q"
              type="text"
              placeholder="ex: Clio 3 1.5 dCi cale à chaud"
              className="w-full bg-transparent py-2 text-ink-900 outline-none placeholder:text-ink-300"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-ink-900 px-6 py-2.5 font-medium text-beige-50 transition hover:bg-ink-700"
          >
            Chercher
          </button>
        </div>
      </form>

      <p className="mt-6 text-xs uppercase tracking-wide text-ink-400">
        Recherches récentes d&apos;autres utilisateurs
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {EXEMPLES.map((ex) => (
          <Link
            key={ex}
            href={`/recherche?q=${encodeURIComponent(ex)}`}
            className="rounded-full border border-ink-100 bg-white px-3 py-1 text-sm text-ink-500 transition hover:border-blue-300 hover:text-blue-700"
          >
            {ex}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 border-t border-ink-100 pt-6 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-ink-900">{s.value}</p>
            <p className="mt-1 text-xs text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
