import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { createDb } from '@forumeka/db/client';
import { accounts, sessions, users, verificationTokens } from '@forumeka/db/schema';

const db = createDb();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM,
    }),
  ],
  pages: {
    verifyRequest: '/connexion/verifier',
  },
  session: {
    strategy: 'database',
  },
});
