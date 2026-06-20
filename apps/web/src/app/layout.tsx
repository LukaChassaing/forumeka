import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forumeka — diagnostic auto collaboratif',
  description: 'Pistes de panne classées par taux de succès, sourcées forums et retours users.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen font-sans antialiased">
        <main className="mx-auto max-w-2xl px-6 py-12">{children}</main>
      </body>
    </html>
  );
}
