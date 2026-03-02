import { Role } from '@/types';

// Re-export for convenience
export { Role };

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

