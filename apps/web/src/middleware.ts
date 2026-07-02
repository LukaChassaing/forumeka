import { auth } from '@/auth';

export const runtime = 'nodejs';

const PUBLIC_PATHS = ['/', '/connexion', '/cgu', '/confidentialite', '/mentions-legales', '/contact'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith('/connexion') ||
    pathname.startsWith('/recherche') ||
    pathname.startsWith('/diag/');
  if (!req.auth && !isPublic) {
    const url = new URL('/connexion', req.nextUrl.origin);
    url.searchParams.set('next', pathname);
    return Response.redirect(url);
  }
});

export const config = {
  // `api/stripe/webhook` est appelé par Stripe (non authentifié) : il ne doit pas passer par l'auth.
  matcher: ['/((?!api/auth|api/stripe/webhook|_next/static|_next/image|favicon.ico).*)'],
};
