import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { AccountBadge } from '@/components/account-badge';
import { HistorySidebar } from '@/components/history-sidebar';
import { BrandSidebar } from '@/components/brand-sidebar';
import { SiteFooter } from '@/components/site-footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forumeka, diagnostic automobile collaboratif',
  description: 'Pistes de panne classées par taux de succès, sourcées forums et retours users.',
};

const THEME_INIT_SCRIPT = `
(function () {
  var stored = localStorage.getItem('theme');
  var dark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <SiteHeader accountSlot={<AccountBadge />} />
        <BrandSidebar />
        <HistorySidebar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
