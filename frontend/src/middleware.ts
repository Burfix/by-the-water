import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that do NOT require authentication
const PUBLIC_PATHS = ['/login', '/register', '/'];

// Role route map – server-safe (no localStorage here, use cookie)
const ROLE_ROUTE_MAP: Record<string, string[]> = {
  STORE: ['/dashboard/my-store', '/dashboard/audits', '/dashboard/certificates', '/dashboard/notifications'],
  PROPERTY_COORDINATOR: [
    '/dashboard/coordinator',
    '/dashboard/stores',
    '/dashboard/audits',
    '/dashboard/certificates',
    '/dashboard/notifications',
  ],
  OPS_MANAGER: [
    '/dashboard',
    '/dashboard/stores',
    '/dashboard/audits',
    '/dashboard/certificates',
    '/dashboard/users',
    '/dashboard/precincts',
    '/dashboard/notifications',
  ],
  EXEC: [
    '/dashboard',
    '/dashboard/stores',
    '/dashboard/audits',
    '/dashboard/certificates',
    '/dashboard/notifications',
  ],
};

function canAccess(role: string, pathname: string): boolean {
  const allowed = ROLE_ROUTE_MAP[role] ?? [];
  return allowed.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function roleHomePath(role: string): string {
  switch (role) {
    case 'STORE':               return '/dashboard/my-store';
    case 'PROPERTY_COORDINATOR': return '/dashboard/coordinator';
    default:                    return '/dashboard';
  }
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Read JWT from cookie
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Decode JWT payload (no verification here – signature verified by NestJS)
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8'),
    );
  const role = payload.role as string;
    const exp: number = payload.exp;

    // Check expiry
    if (exp && Date.now() / 1000 > exp) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('access_token');
      return response;
    }

    // Role-based access control
    if (!canAccess(role, pathname)) {
      return NextResponse.redirect(new URL(roleHomePath(role), request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
