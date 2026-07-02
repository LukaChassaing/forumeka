import Image from 'next/image';
import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

type ExempleProbleme = { titre: string; slug: string };

const STEPS = [
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
      </svg>
    ),
    title: 'Décris ton symptôme naturellement',
    desc: '« voyant ESP allumé »… tape comme tu parlerais à ton garagiste.',
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    title: 'On analyse les retours terrain',
    desc: 'Notre IA croise des milliers de témoignages de mécaniciens et propriétaires sur les forums spécialisés.',
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: 'Tu sais par où commencer',
    desc: 'Chaque piste est classée par son taux de succès réel, vérifié par la communauté.',
  },
];

const PLAN_DECOUVERTE = [
  '5 pistes débloquées à vie',
  'Recherche par symptôme ou véhicule',
  'Pistes identifiées (titres + véhicules)',
];

const PLAN_PRO = [
  'Déblocages illimités',
  'Taux de fiabilité réel',
  'Sources forums (liens + citations)',
  'Badge piste confirmée',
];

export default async function LandingPage() {
  const [{ n: nbThreads }, { n: nbForums }, { n: nbProblemes }, { n: nbPistes }, { n: nbVehicules }, { n: nbConfirmees }, exemplesAll] =
    await Promise.all([
      db.execute<{ n: string }>(sql`select count(*)::int as n from threads`).then((r) => r[0]!),
      db.execute<{ n: string }>(sql`select count(distinct forum)::int as n from threads`).then((r) => r[0]!),
      db.execute<{ n: string }>(sql`select count(*)::int as n from problemes`).then((r) => r[0]!),
      db.execute<{ n: string }>(sql`select count(*)::int as n from pistes`).then((r) => r[0]!),
      db.execute<{ n: string }>(
        sql`select count(distinct v)::int as n from problemes, jsonb_array_elements_text(vehicules) as v`,
      ).then((r) => r[0]!),
      db.execute<{ n: string }>(
        sql`select count(distinct piste_id)::int as n from thread_piste_mentions where statut_dans_thread = 'confirmed'`,
      ).then((r) => r[0]!),
      db.execute<ExempleProbleme>(sql`
        select p.titre, p.slug
        from problemes p
        where (
          select count(*) from pistes pi where pi.probleme_id = p.id
        ) >= 2
        and exists (
          select 1 from pistes pi
          join thread_piste_mentions tpm on tpm.piste_id = pi.id
          where pi.probleme_id = p.id and tpm.statut_dans_thread = 'confirmed'
        )
        order by random()
        limit 8
      `),
    ]);

  const exemplesHero = exemplesAll.slice(0, 4);
  const exemplesCta = exemplesAll.slice(4, 8);

  const stats = [
    { value: nbThreads, label: 'threads analysés' },
    { value: nbForums, label: 'forums sourcés' },
    { value: nbProblemes, label: 'problèmes référencés' },
    { value: nbPistes, label: 'pistes de diagnostic' },
    { value: nbVehicules, label: 'véhicules couverts' },
    { value: nbConfirmees, label: 'pistes confirmées' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="px-6 pb-20 pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3">
            <Image src="/logo.png" alt="Forumeka" width={56} height={56} className="rounded-xl" />
            <h1 className="text-4xl font-bold text-ink-900 sm:text-5xl">Forumeka</h1>
          </div>
          <p className="mt-4 text-xl text-ink-700 sm:text-2xl">
            Diagnostic automobile collaboratif
          </p>
          <p className="mx-auto mt-3 max-w-xl text-ink-500">
            La solution à ton problème est forcément quelque part sur un forum.
            On la trouve pour toi et on te donne les pistes classées par fiabilité.
          </p>

          <form id="recherche" action="/recherche" method="get" className="mx-auto mt-10 max-w-xl">
            <div className="flex gap-2 rounded-xl border border-ink-100 bg-white p-2 shadow-md transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
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
                  required
                  placeholder="ex: voyant ESP allumé Clio 3"
                  className="w-full bg-transparent py-2 text-ink-900 outline-none placeholder:text-ink-300"
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

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {exemplesHero.map((ex) => (
              <Link
                key={ex.slug}
                href={`/diag/${ex.slug}`}
                className="rounded-full border border-ink-100 bg-white px-3 py-1 text-sm text-ink-500 transition hover:border-blue-300 hover:text-blue-700"
              >
                {ex.titre}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="border-t border-ink-100 bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-ink-900 sm:text-3xl">
            Comment ça marche
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-beige-100 text-ink-700">
                  {step.icon}
                </div>
                <p className="mt-1 text-sm font-medium text-ink-300">Étape {i + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-ink-100 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-ink-900 sm:text-3xl">
            Notre base de connaissances
          </h2>
          <p className="mt-3 text-center text-ink-500">
            Des milliers de discussions analysées par IA pour en extraire les vraies solutions.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-white p-5 text-center shadow-sm">
                <p className="text-3xl font-bold text-ink-900">{Number(s.value).toLocaleString('fr-FR')}</p>
                <p className="mt-1 text-sm text-ink-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-ink-100 bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-ink-900 sm:text-3xl">
            Découvre gratuitement
          </h2>
          <p className="mt-3 text-center text-ink-500">
            5 pistes offertes pour trouver ta solution. Passe Premium pour tout débloquer.
          </p>

          <div className="mx-auto mt-12 grid max-w-2xl gap-6 sm:grid-cols-2">
            {/* Découverte */}
            <div className="rounded-2xl border border-ink-100 p-6">
              <h3 className="text-lg font-semibold text-ink-900">Découverte</h3>
              <p className="mt-2 text-sm text-ink-500">Gratuit · 0€</p>
              <ul className="mt-6 space-y-3">
                {PLAN_DECOUVERTE.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/recherche"
                className="mt-8 block rounded-lg border border-ink-900 px-4 py-2.5 text-center text-sm font-medium text-ink-900 transition hover:bg-ink-900 hover:text-beige-50"
              >
                Commencer
              </Link>
            </div>

            {/* Premium */}
            <div className="relative rounded-2xl border-2 border-ink-900 p-6">
              <h3 className="text-lg font-semibold text-ink-900">Premium</h3>
              <p className="mt-2 text-3xl font-bold text-ink-900">
                4,99€<span className="text-base font-normal text-ink-500">/mois</span>
              </p>
              <p className="text-sm text-ink-500">ou 39,99€/an · sans engagement</p>
              <ul className="mt-6 space-y-3">
                {PLAN_PRO.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                    <span className="shrink-0 font-bold text-green-600">+</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/abonnement"
                className="mt-8 block rounded-lg bg-ink-900 px-4 py-2.5 text-center text-sm font-medium text-beige-50 transition hover:bg-ink-700"
              >
                S&apos;abonner
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-ink-100 px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            Décris ton problème, on s&apos;occupe du reste
          </h2>
          <form action="/recherche" method="get" className="mt-8">
            <div className="flex gap-2 rounded-xl border border-ink-100 bg-white p-2 shadow-md transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
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
                  required
                  placeholder="ex: 208 HDi perte de puissance"
                  className="w-full bg-transparent py-2 text-ink-900 outline-none placeholder:text-ink-300"
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
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {exemplesCta.map((ex) => (
              <Link
                key={ex.slug}
                href={`/diag/${ex.slug}`}
                className="rounded-full border border-ink-100 bg-white px-3 py-1 text-sm text-ink-500 transition hover:border-blue-300 hover:text-blue-700"
              >
                {ex.titre}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
