import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // If logged in and visiting /login, redirect to home
    const sessionCookie = request.cookies.get('wefix_session');
    if (sessionCookie && pathname === '/login') {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    return NextResponse.next();
  }

  // Allow Next.js internal routes and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/wefix_logo') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check for session cookie on all other routes
  const sessionCookie = request.cookies.get('wefix_session');
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|wefix_logo.png).*)'],
};
