import Link from 'next/link';

export default function ContactPage() {
  return (
    <div>
      <Link href="/" className="text-sm text-ink-500 hover:text-blue-700">
        ← Retour
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Contact</h1>
      <p className="mt-4 text-sm text-ink-700">
        Une question, un bug à signaler, une suggestion de forum à indexer ? Écris-nous à{' '}
        <a href="mailto:contact@luka-chassaing.fr" className="text-blue-700 hover:underline">
          contact@luka-chassaing.fr
        </a>
        .
      </p>
    </div>
  );
}
