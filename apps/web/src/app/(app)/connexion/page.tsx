import { signIn } from '@/auth';

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900">Connexion</h1>
      <p className="mt-2 text-ink-500">
        Un lien magique te sera envoyé par email — pas de mot de passe.
      </p>
      <form
        action={async (formData) => {
          'use server';
          const email = formData.get('email');
          if (typeof email !== 'string') return;
          await signIn('resend', { email, redirectTo: next ?? '/' });
        }}
        className="mt-6 flex gap-2"
      >
        <input
          name="email"
          type="email"
          required
          placeholder="toi@exemple.fr"
          className="flex-1 rounded border border-ink-100 bg-white px-4 py-3 text-ink-900 outline-none focus:border-ink-300"
        />
        <button
          type="submit"
          className="rounded bg-ink-900 px-5 py-3 text-beige-50 hover:bg-ink-700"
        >
          Recevoir le lien
        </button>
      </form>
    </div>
  );
}
