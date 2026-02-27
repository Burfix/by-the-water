'use client';

import Link from 'next/link';
import {
  LayoutDashboard, Store, ClipboardList, Award, Users,
  MapPin, Bell, X, ChevronRight, ShieldCheck, ClipboardEdit,
} from 'lucide-react';
import { Role } from '@/types';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
    roles: [Role.OPS_MANAGER, Role.EXEC],
  },
  {
    label: 'My Store',
    href: '/dashboard/my-store',
    icon: <Store size={18} />,
    roles: [Role.STORE],
  },
  {
    label: 'Stores',
    href: '/dashboard/stores',
    icon: <Store size={18} />,
    roles: [Role.OPS_MANAGER, Role.EXEC, Role.PROPERTY_COORDINATOR],
  },
  {
    label: 'Audits',
    href: '/dashboard/audits',
    icon: <ClipboardList size={18} />,
    roles: [Role.OPS_MANAGER, Role.EXEC, Role.PROPERTY_COORDINATOR, Role.STORE],
  },
  {
    label: 'Templates',
    href: '/dashboard/audit-templates',
    icon: <ClipboardEdit size={18} />,
    roles: [Role.OPS_MANAGER, Role.PROPERTY_COORDINATOR],
  },
  {
    label: 'Certificates',
    href: '/dashboard/certificates',
    icon: <Award size={18} />,
    roles: [Role.OPS_MANAGER, Role.EXEC, Role.PROPERTY_COORDINATOR, Role.STORE],
  },
  {
    label: 'Precincts',
    href: '/dashboard/precincts',
    icon: <MapPin size={18} />,
    roles: [Role.OPS_MANAGER],
  },
  {
    label: 'Users',
    href: '/dashboard/users',
    icon: <Users size={18} />,
    roles: [Role.OPS_MANAGER],
  },
  {
    label: 'Notifications',
    href: '/dashboard/notifications',
    icon: <Bell size={18} />,
    roles: [Role.OPS_MANAGER, Role.EXEC, Role.PROPERTY_COORDINATOR, Role.STORE],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: Role | null;
  currentPath: string;
}

export function Sidebar({ isOpen, onClose, userRole, currentPath }: SidebarProps) {
  const visibleItems = NAV_ITEMS.filter(
    (item) => userRole && item.roles.includes(userRole),
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0">
        <SidebarContent
          items={visibleItems}
          currentPath={currentPath}
          onClose={onClose}
          showClose={false}
        />
      </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent
          items={visibleItems}
          currentPath={currentPath}
          onClose={onClose}
          showClose
        />
      </aside>
    </>
  );
}

function SidebarContent({
  items,
  currentPath,
  onClose,
  showClose,
}: {
  items: NavItem[];
  currentPath: string;
  onClose: () => void;
  showClose: boolean;
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-brand-700">
          <ShieldCheck size={22} className="text-brand-600" />
          <span className="text-sm leading-tight">
            By The Water<br />
            <span className="font-normal text-gray-400 text-xs">Compliance</span>
          </span>
        </Link>
        {showClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? currentPath === '/dashboard'
              : currentPath.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <span
                className={cn(
                  'shrink-0',
                  isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600',
                )}
              >
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <ChevronRight size={14} className="ml-auto text-brand-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
        v1.0.0 &copy; By The Water
      </div>
    </>
  );
}
