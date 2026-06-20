import { auth } from '@/auth';

const PUBLIC_PATHS = ['/', '/connexion'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith('/connexion'));
  if (!req.auth && !isPublic) {
    const url = new URL('/connexion', req.nextUrl.origin);
    url.searchParams.set('next', pathname);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
