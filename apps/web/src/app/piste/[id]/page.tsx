import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPisteById,
  getProblemeById,
  getThreadMentionsForPiste,
  getAliasesForPiste,
} from '@forumeka/db';
import { db } from '@/lib/db';

const STATUT_LABEL: Record<string, string> = {
  confirmed: 'A fonctionné',
  tested_neutral: 'Testé, sans effet',
  tested_negative: 'Testé, a aggravé le problème',
  mentioned: 'Évoqué sur le forum',
};

const STATUT_STYLE: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800',
  tested_neutral: 'bg-ink-100 text-ink-600',
  tested_negative: 'bg-red-100 text-red-800',
  mentioned: 'bg-blue-100 text-blue-800',
};

export default async function PistePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const piste = await getPisteById(db, id);
  if (!piste) notFound();

  const [mentions, aliases, probleme] = await Promise.all([
    getThreadMentionsForPiste(db, id),
    getAliasesForPiste(db, id),
    getProblemeById(db, piste.problemeId),
  ]);

  return (
    <div>
      {probleme && (
        <Link
          href={`/diag/${probleme.slug}`}
          className="text-sm text-ink-500 hover:text-blue-700"
        >
          ← Problème : {probleme.titre}
        </Link>
      )}
      <p className="mt-4 text-sm font-medium uppercase tracking-wide text-ink-500">Piste suivie</p>
      <h1 className="mt-1 text-2xl font-bold text-ink-900">{piste.titre}</h1>
      {piste.description && <p className="mt-2 text-ink-700">{piste.description}</p>}
      {aliases.length > 0 && (
        <p className="mt-2 text-sm text-ink-500">Aussi connu comme : {aliases.join(', ')}</p>
      )}

      <h2 className="mt-8 text-sm font-medium text-ink-500">Source forum ({mentions.length})</h2>
      <ul className="mt-2 space-y-3">
        {mentions.map((m) => (
          <li key={m.threadId} className="rounded border border-ink-100 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-ink-900">Thread : {m.titre}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_STYLE[m.statutDansThread]}`}
              >
                {STATUT_LABEL[m.statutDansThread]}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              Forum : {m.forum}
              {m.traduit && ' · traduit de l’anglais'}
            </p>
            {m.extrait && (
              <p className="mt-2 text-sm text-ink-700">
                Un utilisateur a écrit <span className="italic">« {m.extrait} »</span>
              </p>
            )}
            <a
              href={m.postUrl ?? m.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              Voir le thread →
            </a>
          </li>
        ))}
      </ul>
      {mentions.length === 0 && (
        <p className="mt-2 text-ink-500">Aucune source forum pour l&apos;instant.</p>
      )}

      <p className="mt-10 border-t border-ink-100 pt-4 text-sm text-ink-500">
        💡 Un <strong>thread</strong>, c&apos;est une discussion sur un forum automobile : un
        internaute y décrit sa panne, d&apos;autres y répondent avec des pistes, jusqu&apos;à
        trouver (ou pas) la solution. C&apos;est notre principale source d&apos;information.
      </p>
    </div>
  );
}
