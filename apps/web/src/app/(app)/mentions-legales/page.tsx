import Link from 'next/link';

export default function MentionsLegalesPage() {
  return (
    <div>
      <Link href="/" className="text-sm text-ink-500 hover:text-blue-700">
        ← Retour
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Mentions légales</h1>

      <div className="mt-6 space-y-6 text-sm text-ink-700">
        <section>
          <h2 className="font-semibold text-ink-900">Éditeur</h2>
          <p className="mt-1">
            Forumeka est édité par POLYMERA COMPOSITES, SASU au capital de 1,00 €.
            <br />
            Siège social : 175 chemin de Chanouillet, 26300 Besayes.
            <br />
            SIREN : 952 164 465 — RCS Romans.
            <br />
            Directeur de la publication : Luka Chassaing.
            <br />
            Contact : contact@luka-chassaing.fr
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">Hébergement</h2>
          <p className="mt-1">
            Application hébergée par Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789,
            États-Unis).
            <br />
            Base de données hébergée par Neon, Inc. (région Frankfurt, eu-central-1).
            <br />
            Nom de domaine géré par IONOS SARL.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">Propriété intellectuelle</h2>
          <p className="mt-1">
            L&apos;ensemble des éléments de Forumeka (marque, logo, code, design) est la propriété
            de l&apos;éditeur, sauf mention contraire. Le contenu des pistes de diagnostic est
            généré à partir de discussions publiques de forums automobiles tiers, créditées et liées
            à leur source.
          </p>
        </section>
      </div>
    </div>
  );
}
