import Link from 'next/link';

export default function ConfidentialitePage() {
  return (
    <div>
      <Link href="/" className="text-sm text-ink-500 hover:text-blue-700">
        ← Retour
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Confidentialité</h1>

      <div className="mt-6 space-y-6 text-sm text-ink-700">
        <section>
          <h2 className="font-semibold text-ink-900">Données collectées</h2>
          <p className="mt-1">
            Adresse email (création de compte et connexion par lien magique), historique de
            recherche et de consultation des pistes/problèmes, déverrouillages effectués, et statut
            d&apos;abonnement. Aucun mot de passe n&apos;est stocké.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">Sous-traitants</h2>
          <p className="mt-1">
            Resend (envoi des emails de connexion), Stripe (paiement par carte et PayPal), Neon
            (hébergement de la base de données, Frankfurt), Vercel (hébergement de
            l&apos;application).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">Finalité</h2>
          <p className="mt-1">
            Ces données servent uniquement à faire fonctionner le service : authentification,
            gestion de l&apos;abonnement, et personnalisation (historique de consultation). Aucune
            donnée n&apos;est vendue à des tiers.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">Vos droits</h2>
          <p className="mt-1">
            Conformément au RGPD, vous pouvez demander l&apos;accès, la rectification ou la
            suppression de vos données en écrivant à contact@luka-chassaing.fr.
          </p>
        </section>
      </div>
    </div>
  );
}
