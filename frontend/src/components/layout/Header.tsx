'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, Bell, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { notificationsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface HeaderProps {
  user: User | null;
  onMenuClick: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  STORE: 'Store Manager',
  PROPERTY_COORDINATOR: 'Property Coordinator',
  OPS_MANAGER: 'Ops Manager',
  EXEC: 'Executive',
};

export function Header({ user, onMenuClick }: HeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationsApi.getUnreadCount().then(setUnreadCount).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-6 gap-3 shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <Link
        href="/dashboard/notifications"
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
            {user?.firstName?.[0] ?? 'U'}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role ? ROLE_LABELS[user.role] ?? user.role : ''}
            </p>
          </div>
          <ChevronDown
            size={14}
            className={cn('text-gray-400 transition-transform', dropdownOpen && 'rotate-180')}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setDropdownOpen(false)}
            >
              <UserIcon size={15} className="text-gray-400" />
              Profile
            </Link>
            <hr className="my-1 border-gray-100" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
