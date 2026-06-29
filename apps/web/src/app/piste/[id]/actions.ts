'use server';

import { revalidatePath } from 'next/cache';
import { unlockPisteFree } from '@forumeka/db';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function unlockPisteGratuit(pisteId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, reason: 'unauthenticated' as const };
  }
  const result = await unlockPisteFree(db, session.user.id, pisteId);
  if (result.ok) {
    revalidatePath(`/piste/${pisteId}`);
  }
  return result;
}
