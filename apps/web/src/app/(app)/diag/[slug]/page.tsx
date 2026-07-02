import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getProblemeBySlug,
  getPistesForProbleme,
  hasActiveSubscription,
  getUnlockedPisteIds,
  recordConsultation,
} from '@forumeka/db';
import { auth } from '@/auth';
import { db } from '@/lib/db';

function probabilite(
  threadsConfirmed: number,
  threadsTotal: number,
): {
  label: string;
  style: string;
} {
  if (threadsTotal === 0) return { label: 'Pas encore évaluée', style: 'bg-ink-100 text-ink-500' };
  const taux = threadsConfirmed / threadsTotal;
  if (taux >= 0.66) return { label: 'Très probable', style: 'bg-green-100 text-green-800' };
  if (taux >= 0.33) return { label: 'Probable', style: 'bg-blue-100 text-blue-800' };
  return { label: 'Peu probable', style: 'bg-amber-100 text-amber-800' };
}

export default async function DiagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const probleme = await getProblemeBySlug(db, slug);
  if (!probleme) notFound();

  const session = await auth();
  // L'ordre réel (trié par taux de succès) révèle la fiabilité relative des pistes : c'est ce que
  // débloque l'abonnement. Sans abonnement actif, l'ordre est randomisé à chaque affichage
  // (§ monetization.md) — seuls les titres restent toujours visibles.
  const subscribed = session?.user?.id ? await hasActiveSubscription(db, session.user.id) : false;
  const pistes = await getPistesForProbleme(db, probleme.id, !subscribed);
  const nbSolutionsConfirmees = pistes.filter((p) => p.threadsConfirmed > 0).length;
  const unlockedPisteIds = session?.user?.id
    ? await getUnlockedPisteIds(
        db,
        session.user.id,
        pistes.map((p) => p.id),
      )
    : new Set<string>();
  if (session?.user?.id) {
    await recordConsultation(
      db,
      session.user.id,
      'probleme',
      probleme.id,
      probleme.titre,
      `/diag/${probleme.slug}`,
    );
  }

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-wide text-ink-500">
        Véhicule : {probleme.vehicules.join(' / ')}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-ink-900">{probleme.titre}</h1>

      <p className="mt-6 text-ink-700">
        <span className="font-semibold text-ink-900">{pistes.length}</span> piste
        {pistes.length === 1 ? '' : 's'} connue{pistes.length === 1 ? '' : 's'},{' '}
        <span className="font-semibold text-ink-900">{nbSolutionsConfirmees}</span> confirmée
        {nbSolutionsConfirmees === 1 ? '' : 's'} par au moins un thread
        {subscribed ? ', classées par taux de succès.' : '.'}
      </p>

      <ul className="mt-6 space-y-3">
        {pistes.map((piste, i) => {
          const unlocked = unlockedPisteIds.has(piste.id);
          const { label, style } = unlocked
            ? probabilite(piste.threadsConfirmed, piste.threadsTotal)
            : { label: '🔒 Voir la fiabilité', style: 'bg-ink-100 text-ink-500' };
          return (
            <li key={piste.id} className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm">
              <Link href={`/piste/${piste.id}`} className="group flex items-center gap-4">
                {subscribed ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-beige-50">
                    {i + 1}
                  </span>
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-400">
                    •
                  </span>
                )}
                <div className="flex-1">
                  <p className="font-medium text-ink-900 group-hover:text-blue-700">
                    {piste.titre}
                  </p>
                  <p className="mt-1 text-sm text-ink-500">
                    {piste.threadsTotal === 0
                      ? 'Pas encore mentionnée sur les forums'
                      : `piste mentionnée ${piste.threadsTotal} fois sur les forums, ${
                          piste.threadsConfirmed === 0
                            ? 'jamais confirmée'
                            : `confirmée ${piste.threadsConfirmed} fois`
                        }`}
                  </p>
                </div>
                <span
                  className={`flex shrink-0 flex-col items-center rounded-lg px-3 py-1.5 text-center ${style}`}
                >
                  <span className="text-sm font-semibold">{label}</span>
                  {unlocked && piste.threadsTotal > 0 && (
                    <span className="text-xs opacity-80">
                      {piste.threadsConfirmed}/{piste.threadsTotal}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-ink-300 group-hover:text-ink-500">›</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {pistes.length === 0 && (
        <p className="mt-4 text-ink-500">Pas encore de piste indexée pour ce problème.</p>
      )}

      <p className="mt-10 border-t border-ink-100 pt-4 text-sm text-ink-500">
        💡 Un <strong>thread</strong>, c&apos;est une discussion sur un forum automobile : un
        internaute y décrit sa panne, d&apos;autres y répondent avec des pistes, jusqu&apos;à
        trouver (ou pas) la solution. C&apos;est notre principale source d&apos;information.
      </p>
    </div>
  );
}
