'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Role, AuthTokens } from '@/types';
import { authApi } from '@/lib/api';
import { setAuthTokens, clearAuth, getStoredUser, getDashboardPath } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const tokens: AuthTokens = await authApi.login(email, password);
        setAuthTokens(tokens);
        setUser(tokens.user);
        toast.success(`Welcome back, ${tokens.user.firstName}!`);
        router.push(getDashboardPath(tokens.user.role));
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

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push('/login');
  }, [router]);

  const hasRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
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
