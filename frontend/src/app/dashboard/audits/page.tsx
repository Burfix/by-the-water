'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter } from 'lucide-react';
import { Audit, AuditStatus, Role } from '@/types';
import { auditsApi, storesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { DataTable, Column } from '@/components/ui/DataTable';
import { AuditStatusBadge } from '@/components/ui/AuditStatusBadge';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 15;

export default function AuditsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStore = user?.role === Role.STORE;
  const [audits, setAudits] = useState<Audit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AuditStatus | ''>('');
  const [search, setSearch] = useState('');
  const [myStoreId, setMyStoreId] = useState<string | null>(null);
  const [storeReady, setStoreReady] = useState(!isStore);

  // Fetch own store once for STORE role
  useEffect(() => {
    if (!isStore) return;
    storesApi.getMyStore()
      .then((s) => { setMyStoreId(s.id); setStoreReady(true); })
      .catch(() => setStoreReady(true));
  }, [isStore]);

  const canCreate = user?.role === Role.OPS_MANAGER || user?.role === Role.PROPERTY_COORDINATOR;

  const load = useCallback(async () => {
    if (!storeReady) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (myStoreId) params.storeId = myStoreId;
      const result = await auditsApi.getAll(params);
      setAudits(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, myStoreId, storeReady]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<Audit>[] = [
    ...(!isStore ? [{
      key: 'store' as const,
      header: 'Store',
      render: (row: Audit) => (
        <div>
          <p className="font-medium text-gray-900">{row.store?.name ?? '—'}</p>
          <p className="text-xs text-gray-400">{row.store?.storeCode}</p>
        </div>
      ),
    }] : []),
    {
      key: 'auditType',
      header: 'Type',
      render: (row) => row.auditType ?? 'General',
    },
    {
      key: 'scheduledDate',
      header: 'Scheduled',
      sortable: true,
      render: (row) => formatDate(row.scheduledDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <AuditStatusBadge status={row.status} />,
    },
    {
      key: 'complianceScore',
      header: 'Score',
      sortable: true,
      render: (row) =>
        row.complianceScore != null ? (
          <ScoreBadge score={row.complianceScore} size="sm" />
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      key: 'auditor',
      header: 'Auditor',
      render: (row) =>
        row.auditor ? `${row.auditor.firstName} ${row.auditor.lastName}` : '—',
    },
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audits</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total audits</p>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push('/dashboard/audits/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            New Audit
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={isStore ? 'Search audits...' : 'Search stores...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as AuditStatus | ''); setPage(1); }}
            className="input w-40"
          >
            <option value="">All statuses</option>
            {Object.values(AuditStatus).map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={audits.filter((a) =>
          !search || a.auditType?.toLowerCase().includes(search.toLowerCase()) ||
          (!isStore && a.store?.name?.toLowerCase().includes(search.toLowerCase())),
        )}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyMessage="No audits found."
        onRowClick={(row) => router.push(`/dashboard/audits/${row.id}`)}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
