'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, UserPlus, Users, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Role } from '@/types';
import { getUsers, updateUser, removeUser, StoredUser } from '@/lib/userStore';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { ImportUsersModal, ROLE_LABELS } from '@/components/users/ImportUsersModal';
import { AddUserModal } from '@/components/users/AddUserModal';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 15;

const ROLE_COLORS: Record<Role, string> = {
  [Role.STORE]:                'bg-blue-100 text-blue-700',
  [Role.PROPERTY_COORDINATOR]: 'bg-purple-100 text-purple-700',
  [Role.OPS_MANAGER]:          'bg-orange-100 text-orange-700',
  [Role.EXEC]:                 'bg-gray-100 text-gray-700',
};

export default function UsersPage() {
  const [allUsers,    setAllUsers]    = useState<StoredUser[]>([]);
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState<Role | ''>('');
  const [page,        setPage]        = useState(1);
  const [showImport,  setShowImport]  = useState(false);
  const [showAdd,     setShowAdd]     = useState(false);

  const refresh = useCallback(() => setAllUsers(getUsers()), []);
  useEffect(() => { refresh(); }, [refresh]);

  function handleToggle(user: StoredUser) {
    updateUser(user.id, { isActive: !user.isActive });
    toast.success(`${user.firstName} ${user.isActive ? 'deactivated' : 'activated'}`);
    refresh();
  }

  function handleRemove(user: StoredUser) {
    if (!window.confirm(`Remove ${user.firstName} ${user.lastName}? This cannot be undone.`)) return;
    removeUser(user.id);
    toast.success('User removed');
    refresh();
  }

  // Filter + paginate client-side
  const filtered = allUsers.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<StoredUser>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.firstName} {row.lastName}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[row.role]}`}>
          {ROLE_LABELS[row.role]}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => <span className="text-sm text-gray-500">{row.phone ?? '—'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Added',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-500">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <span className={row.isActive ? 'badge-success' : 'badge-danger'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle(row); }}
            className="text-xs text-gray-500 hover:text-brand-600 underline"
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRemove(row); }}
            className="text-gray-300 hover:text-red-500 transition-colors"
            title="Remove user"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {allUsers.length} user{allUsers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Upload size={15} /> Import from Excel
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <UserPlus size={15} /> Add User
          </button>
        </div>
      </div>

      {allUsers.length === 0 ? (
        /* ── Empty state ── */
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Users size={30} className="text-brand-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No users yet</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
            Import multiple users at once from an Excel spreadsheet, or add them one at a time.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => setShowImport(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Upload size={16} /> Import from Excel
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <UserPlus size={16} /> Add Manually
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="input pl-9 w-56"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value as Role | ''); setPage(1); }}
              className="input w-44"
            >
              <option value="">All roles</option>
              {Object.entries(ROLE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {(search || roleFilter) && (
              <button
                onClick={() => { setSearch(''); setRoleFilter(''); setPage(1); }}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Clear filters
              </button>
            )}
            <span className="text-sm text-gray-400 ml-auto">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <DataTable
            columns={columns}
            data={paged}
            keyExtractor={(r) => r.id}
            loading={false}
            emptyMessage="No users match your search."
          />

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {showImport && (
        <ImportUsersModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); refresh(); }}
        />
      )}

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); refresh(); }}
        />
      )}
    </div>
  );
}
