'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { unlockPisteGratuit } from './actions';

export function UnlockButton({
  pisteId,
  freeUnlocksRemaining,
  isAuthenticated,
}: {
  pisteId: string;
  freeUnlocksRemaining: number;
  isAuthenticated: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <a
        href="/connexion"
        className="inline-flex items-center rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-beige-50 hover:bg-ink-700"
      >
        Se connecter pour débloquer
      </a>
    );
  }

  if (freeUnlocksRemaining <= 0) {
    return (
      <a
        href="/abonnement"
        className="inline-flex items-center rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-beige-50 hover:bg-ink-700"
      >
        S&apos;abonner pour débloquer
      </a>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await unlockPisteGratuit(pisteId);
            if (!result.ok) {
              setError("Plus de déverrouillage gratuit disponible.");
              return;
            }
            router.refresh();
          })
        }
        className="inline-flex items-center rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-beige-50 hover:bg-ink-700 disabled:opacity-60"
      >
        {pending
          ? 'Déverrouillage…'
          : `Débloquer gratuitement (${freeUnlocksRemaining} restant${freeUnlocksRemaining > 1 ? 's' : ''})`}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
