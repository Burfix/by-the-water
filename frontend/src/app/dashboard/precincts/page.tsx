'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Precinct } from '@/types';
import { precinctsApi } from '@/lib/api';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 15;

export default function PrecinctsPage() {
  const router = useRouter();
  const [precincts, setPrecincts] = useState<Precinct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await precinctsApi.getAll({ page, limit: PAGE_SIZE });
      setPrecincts(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<Precinct>[] = [
    {
      key: 'name',
      header: 'Precinct Name',
      sortable: true,
      render: (row) => <p className="font-medium text-gray-900">{row.name}</p>,
    },
    { key: 'region', header: 'Region', sortable: true, render: (row) => row.region ?? '—' },
    {
      key: 'storeCount',
      header: 'Stores',
      render: (row) => (row as Precinct & { storeCount?: number }).storeCount ?? '—',
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Precincts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} precincts</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/precincts/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Add Precinct
        </button>
      </div>

      <DataTable
        columns={columns}
        data={precincts}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyMessage="No precincts found."
        onRowClick={(row) => router.push(`/dashboard/precincts/${row.id}`)}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
