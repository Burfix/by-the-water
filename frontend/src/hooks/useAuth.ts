'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Role } from '@/types';
import { authApi } from '@/lib/api';
import { getDashboardPath } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount: verify session by calling /auth/me (cookie is sent automatically)
  useEffect(() => {
    authApi.getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const { user: loggedIn } = await authApi.login(email, password);
        setUser(loggedIn);
        toast.success(`Welcome back, ${loggedIn.firstName}!`);
        router.push(getDashboardPath(loggedIn.role as Role));
      } catch (err: any) {
        const message = err.response?.data?.message || 'Login failed. Please try again.';
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // swallow — cookies cleared server-side, redirect regardless
    }
    setUser(null);
    router.push('/login');
  }, [router]);

  const hasRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role as Role),
    [user],
  );

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
  };
}


