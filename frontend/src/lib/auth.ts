import Cookies from 'js-cookie';
import { AuthTokens, User, Role } from '@/types';
import { authApi } from './api';

// Re-export for convenience (enum values as strings still work for comparisons)
export { Role };

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  expires: 1, // 1 day for access token
};

export function setAuthTokens(tokens: AuthTokens): void {
  Cookies.set(ACCESS_TOKEN_KEY, tokens.accessToken, { ...COOKIE_OPTIONS, expires: 1 });
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, { ...COOKIE_OPTIONS, expires: 7 });
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
  }
}

export function clearAuth(): void {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
}

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function getUserRole(): Role | null {
  return getStoredUser()?.role ?? null;
}

export function hasRole(...roles: Role[]): boolean {
  const role = getUserRole();
  return !!role && roles.includes(role);
}

export async function logout(): Promise<void> {
  clearAuth();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/** Role-based landing path after login */
export function getDashboardPath(role: Role): string {
  switch (role) {
    case Role.STORE:
      return '/dashboard/my-store';
    case Role.PROPERTY_COORDINATOR:
      return '/dashboard/coordinator';
    case Role.OPS_MANAGER:
      return '/dashboard';
    case Role.EXEC:
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

/** Routes accessible by each role */
export const ROLE_ROUTES: Record<Role, string[]> = {
  [Role.STORE]: ['/dashboard/my-store', '/dashboard/audits', '/dashboard/certificates', '/dashboard/notifications'],
  [Role.PROPERTY_COORDINATOR]: [
    '/dashboard/coordinator',
    '/dashboard/stores',
    '/dashboard/audits',
    '/dashboard/certificates',
    '/dashboard/notifications',
  ],
  [Role.OPS_MANAGER]: ['/dashboard', '/dashboard/stores', '/dashboard/audits', '/dashboard/certificates', '/dashboard/users', '/dashboard/precincts', '/dashboard/notifications'],
  [Role.EXEC]: ['/dashboard', '/dashboard/stores', '/dashboard/audits', '/dashboard/certificates', '/dashboard/notifications'],
};
