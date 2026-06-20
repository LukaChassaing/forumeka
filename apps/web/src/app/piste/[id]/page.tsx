import { notFound } from 'next/navigation';
import { getPisteById, getThreadMentionsForPiste, getAliasesForPiste } from '@forumeka/db';
import { db } from '@/lib/db';

const STATUT_LABEL: Record<string, string> = {
  confirmed: 'Confirmé',
  tested_neutral: 'Testé, sans effet',
  tested_negative: 'Testé, a aggravé',
  mentioned: 'Mentionné',
};

export default async function PistePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const piste = await getPisteById(db, id);
  if (!piste) notFound();

  const [mentions, aliases] = await Promise.all([
    getThreadMentionsForPiste(db, id),
    getAliasesForPiste(db, id),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900">{piste.titre}</h1>
      {piste.description && <p className="mt-2 text-ink-700">{piste.description}</p>}
      {aliases.length > 0 && (
        <p className="mt-2 text-sm text-ink-500">Aussi connu comme : {aliases.join(', ')}</p>
      )}

      <h2 className="mt-8 text-sm font-medium text-ink-500">Sources forum</h2>
      <ul className="mt-2 space-y-3">
        {mentions.map((m) => (
          <li key={m.threadId} className="rounded border border-ink-100 bg-white p-4">
            <a
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="text-ink-900 hover:underline"
            >
              {m.titre}
            </a>
            <p className="mt-1 text-sm text-ink-500">
              {m.forum} — {STATUT_LABEL[m.statutDansThread]}
            </p>
            {m.extrait && <p className="mt-2 text-sm text-ink-700">« {m.extrait} »</p>}
          </li>
        ))}
      </ul>
      {mentions.length === 0 && (
        <p className="mt-2 text-ink-500">Aucune source forum pour l&apos;instant.</p>
      )}
    </div>
  );
}
