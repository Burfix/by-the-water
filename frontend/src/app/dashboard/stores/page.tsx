'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Store, Role } from '@/types';
import { storesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { Pagination } from '@/components/ui/Pagination';

const PAGE_SIZE = 15;

export default function StoresPage() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const canCreate = hasRole(Role.OPS_MANAGER);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await storesApi.getAll({ page, limit: PAGE_SIZE });
      setStores(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<Store>[] = [
    {
      key: 'name',
      header: 'Store Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400">{row.storeCode}</p>
        </div>
      ),
    },
    {
      key: 'precinct',
      header: 'Precinct',
      render: (row) => row.precinct?.name ?? '—',
    },
    {
      key: 'city',
      header: 'City',
      render: (row) => row.city ?? '—',
    },
    {
      key: 'complianceScore',
      header: 'Compliance',
      sortable: true,
      render: (row) =>
        row.complianceScore != null ? (
          <ScoreBadge score={row.complianceScore} size="sm" />
        ) : (
          <span className="text-gray-400 text-xs">No data</span>
        ),
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
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filtered = stores.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.storeCode.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Stores</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} stores</p>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push('/dashboard/stores/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Add Store
          </button>
        )}
      </div>

      <div className="relative w-48">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search stores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9 w-full"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyMessage="No stores found."
        onRowClick={(row) => router.push(`/dashboard/stores/${row.id}`)}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
