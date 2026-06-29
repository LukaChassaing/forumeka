import Link from 'next/link';
import { hasActiveSubscription } from '@forumeka/db';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { AccountMenu } from './account-menu';

export async function AccountBadge() {
  const session = await auth();
  if (!session?.user) {
    return (
      <Link
        href="/connexion"
        className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
      >
        Se connecter
      </Link>
    );
  }

  const label = session.user.name ?? session.user.email ?? 'Mon compte';
  const subscribed = session.user.id ? await hasActiveSubscription(db, session.user.id) : false;

  return <AccountMenu label={label} email={session.user.email ?? null} subscribed={subscribed} />;
}
