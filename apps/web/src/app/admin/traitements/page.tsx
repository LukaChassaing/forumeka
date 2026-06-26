import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBatches } from '@forumeka/db';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { isAdminEmail } from '@/lib/admin';

function formatDateTimeFr(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return 'en cours…';
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}min ${s % 60}s`;
}

export default async function TraitementsPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) notFound();

  const batches = await getBatches(db);

  return (
    <div>
      <Link href="/admin" className="text-sm text-ink-500 hover:text-blue-700">
        ← Admin
      </Link>
      <p className="mt-4 text-sm font-medium uppercase tracking-wide text-ink-500">Admin</p>
      <h1 className="mt-1 text-2xl font-bold text-ink-900">Traitements</h1>

      <ul className="mt-6 space-y-3">
        {batches.map((b) => (
          <li key={b.id} className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm">
            <Link href={`/admin/traitements/lot?id=${b.id}`} className="block hover:text-blue-700">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink-900">{formatDateTimeFr(b.startedAt)}</span>
                <span className="text-sm text-ink-500">{formatDuration(b.startedAt, b.finishedAt)}</span>
              </div>
              <p className="mt-1 text-sm text-ink-500">
                {b.threadsProcessed}/{b.requestedMax === 0 ? '∞' : b.requestedMax} threads — +{b.problemesCreated} problème
                {b.problemesCreated === 1 ? '' : 's'}, +{b.pistesCreated} piste{b.pistesCreated === 1 ? '' : 's'}
              </p>
              <p className="mt-1 text-xs text-ink-400">
                {b.forums.map((f) => `${f.subForumLabel} (${f.count})`).join(', ')}
              </p>
              <p className="mt-1 text-xs text-ink-400">
                {b.inputTokens.toLocaleString('fr-FR')} tokens entrée, {b.outputTokens.toLocaleString('fr-FR')} tokens
                sortie — ~{b.estimatedCostUsd.toFixed(3)}$
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {batches.length === 0 && <p className="mt-4 text-ink-500">Aucun traitement pour l’instant.</p>}
    </div>
  );
}
