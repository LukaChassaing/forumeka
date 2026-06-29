import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPisteById,
  getProblemeById,
  getThreadMentionsForPiste,
  getAliasesForPiste,
  isPisteUnlocked,
  countFreeUnlocksUsed,
  FREE_UNLOCKS_PER_USER,
  recordConsultation,
} from '@forumeka/db';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { UnlockButton } from './unlock-button';

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

  const session = await auth();
  const userId = session?.user?.id;

  const [aliases, probleme, unlocked, freeUnlocksUsed] = await Promise.all([
    getAliasesForPiste(db, id),
    getProblemeById(db, piste.problemeId),
    userId ? isPisteUnlocked(db, userId, id) : Promise.resolve(false),
    userId ? countFreeUnlocksUsed(db, userId) : Promise.resolve(0),
  ]);
  // Les sources forum sont une donnée payante : on ne les récupère même pas si l'accès n'est pas
  // déverrouillé, pour ne jamais risquer de les renvoyer dans le HTML (§ monetization.md).
  const mentions = unlocked ? await getThreadMentionsForPiste(db, id) : [];
  const freeUnlocksRemaining = Math.max(0, FREE_UNLOCKS_PER_USER - freeUnlocksUsed);
  if (userId) {
    await recordConsultation(db, userId, 'piste', piste.id, piste.titre, `/piste/${piste.id}`);
  }

  return (
    <div>
      {probleme && (
        <Link href={`/diag/${probleme.slug}`} className="text-sm text-ink-500 hover:text-blue-700">
          ← Problème : {probleme.titre}
        </Link>
      )}
      <p className="mt-4 text-sm font-medium uppercase tracking-wide text-ink-500">Piste suivie</p>
      <h1 className="mt-1 text-2xl font-bold text-ink-900">{piste.titre}</h1>
      {piste.description && <p className="mt-2 text-ink-700">{piste.description}</p>}
      {aliases.length > 0 && (
        <p className="mt-2 text-sm text-ink-500">Aussi connu comme : {aliases.join(', ')}</p>
      )}

      <h2 className="mt-8 text-sm font-medium text-ink-500">Source forum</h2>
      {unlocked ? (
        <>
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
        </>
      ) : (
        <div className="mt-2 rounded border border-ink-100 bg-ink-50 p-4">
          <p className="text-sm text-ink-600">
            🔒 Les sources forum (extraits, liens, nombre de confirmations) sont réservées aux
            membres.
          </p>
          <div className="mt-3">
            <UnlockButton
              pisteId={id}
              freeUnlocksRemaining={freeUnlocksRemaining}
              isAuthenticated={Boolean(userId)}
            />
          </div>
        </div>
      )}

      <p className="mt-10 border-t border-ink-100 pt-4 text-sm text-ink-500">
        💡 Un <strong>thread</strong>, c&apos;est une discussion sur un forum automobile : un
        internaute y décrit sa panne, d&apos;autres y répondent avec des pistes, jusqu&apos;à
        trouver (ou pas) la solution. C&apos;est notre principale source d&apos;information.
      </p>
    </div>
  );
}
