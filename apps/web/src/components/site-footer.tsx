import Link from 'next/link';

const LINKS = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/cgu', label: 'CGU' },
  { href: '/confidentialite', label: 'Confidentialité' },
  { href: '/contact', label: 'Contact' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-100 py-8">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-6 text-sm text-ink-500 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Forumeka</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink-900">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
