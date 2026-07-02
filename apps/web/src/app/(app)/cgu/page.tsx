import Link from 'next/link';

export default function CguPage() {
  return (
    <div>
      <Link href="/" className="text-sm text-ink-500 hover:text-blue-700">
        ← Retour
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">
        Conditions Générales d&apos;Utilisation
      </h1>

      <div className="mt-6 space-y-6 text-sm text-ink-700">
        <section>
          <h2 className="font-semibold text-ink-900">1. Objet</h2>
          <p className="mt-1">
            Forumeka est un service de diagnostic automobile collaboratif qui agrège et classe des
            pistes de panne issues de discussions publiques sur des forums automobiles. Les
            présentes CGU régissent l&apos;utilisation du site et du compte utilisateur.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">2. Nature de l&apos;information</h2>
          <p className="mt-1">
            Les pistes proposées sont issues de témoignages d&apos;internautes et d&apos;une analyse
            automatisée, pas d&apos;un diagnostic professionnel. Elles sont fournies à titre
            informatif et ne remplacent pas l&apos;avis d&apos;un garagiste ou mécanicien qualifié.
            Forumeka ne garantit pas l&apos;exactitude, l&apos;exhaustivité ou l&apos;efficacité des
            pistes proposées.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">3. Compte et abonnement</h2>
          <p className="mt-1">
            La création d&apos;un compte donne droit à un nombre limité de déverrouillages gratuits
            à vie. Au-delà, l&apos;accès complet aux pistes (fiabilité réelle et sources forum)
            nécessite un abonnement payant (mensuel ou annuel), payable par carte ou PayPal via
            Stripe. L&apos;abonnement se renouvelle automatiquement jusqu&apos;à annulation,
            possible à tout moment depuis l&apos;espace compte, sans préavis ni pénalité ; aucun
            remboursement prorata temporis n&apos;est dû pour la période en cours sauf disposition
            légale contraire.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">4. Responsabilité</h2>
          <p className="mt-1">
            L&apos;utilisateur reste seul responsable des interventions effectuées sur son véhicule.
            Forumeka ne pourra être tenu responsable d&apos;un dommage résultant de
            l&apos;application d&apos;une piste proposée sur le service.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">5. Modification des CGU</h2>
          <p className="mt-1">
            Ces conditions peuvent être mises à jour ; la version en vigueur est celle publiée sur
            cette page.
          </p>
        </section>
      </div>
    </div>
  );
}
