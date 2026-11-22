import { jwtVerify } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';

const COOKIE = 'elams_session';
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/_debug'];

function key() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'local-dev-secret-please-replace-with-a-long-random-value',
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE)?.value;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  let role: string | null = null;
  if (token) {
    try {
      role = (await jwtVerify(token, key())).payload.role as string;
    } catch {
      role = null;
    }
  }

  if (!role) {
    if (isPublic) return NextResponse.next();
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Please sign in to continue', details: null } },
        { status: 401 },
      );
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (token) response.cookies.delete(COOKIE);
    return response;
  }

  if (isPublic) return NextResponse.redirect(new URL('/dashboard', request.url));

  const hrOnly = ['/employees', '/audit'];
  const managerPlus = ['/approvals', '/reports', '/payroll'];
  if (hrOnly.some((path) => pathname.startsWith(path)) && role !== 'HR') {
    return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url));
  }
  if (
    managerPlus.some((path) => pathname.startsWith(path)) &&
    role !== 'HR' &&
    role !== 'MANAGER'
  ) {
    return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)',
  ],
};
