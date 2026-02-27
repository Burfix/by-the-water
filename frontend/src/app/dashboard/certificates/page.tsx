'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Certificate, Role } from '@/types';
import { certificatesApi, storesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { UploadCertificateModal } from '@/components/certificates/UploadCertificateModal';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 15;

function ExpiryBadge({ cert }: { cert: Certificate }) {
  if (cert.isExpired) return <span className="badge-danger">Expired</span>;
  if (cert.isExpiringSoon) return <span className="badge-warning">{cert.daysUntilExpiry}d left</span>;
  return <span className="badge-success">Valid</span>;
}

export default function CertificatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStore = user?.role === Role.STORE;
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired'>('all');
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [myStoreId, setMyStoreId] = useState<string | null>(null);
  const [storeReady, setStoreReady] = useState(!isStore);

  const canManage = user?.role === Role.OPS_MANAGER || user?.role === Role.PROPERTY_COORDINATOR;

  // Fetch own store once for STORE role
  useEffect(() => {
    if (!isStore) return;
    storesApi.getMyStore()
      .then((s) => { setMyStoreId(s.id); setStoreReady(true); })
      .catch(() => setStoreReady(true));
  }, [isStore]);

  const load = useCallback(async () => {
    if (!storeReady) return;
    setLoading(true);
    try {
      const storeParam = myStoreId ? { storeId: myStoreId } : {};
      if (filter === 'expiring') {
        const data = await certificatesApi.getExpiring(30);
        const filtered = myStoreId ? data.filter((c) => c.storeId === myStoreId) : data;
        setCerts(filtered);
        setTotal(filtered.length);
      } else if (filter === 'expired') {
        const data = await certificatesApi.getExpired();
        const filtered = myStoreId ? data.filter((c) => c.storeId === myStoreId) : data;
        setCerts(filtered);
        setTotal(filtered.length);
      } else {
        const result = await certificatesApi.getAll({ page, limit: PAGE_SIZE, ...storeParam });
        setCerts(result.data);
        setTotal(result.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, filter, myStoreId, storeReady]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<Certificate>[] = [
    ...(!isStore ? [{
      key: 'store' as const,
      header: 'Store',
      render: (row: Certificate) => (
        <div>
          <p className="font-medium text-gray-900">{row.store?.name ?? '—'}</p>
          <p className="text-xs text-gray-400">{row.store?.storeCode}</p>
        </div>
      ),
    }] : []),
    { key: 'certificateType', header: 'Certificate Type', sortable: true },
    { key: 'issueDate', header: 'Issue Date', sortable: true, render: (row) => formatDate(row.issueDate) },
    { key: 'expiryDate', header: 'Expiry Date', sortable: true, render: (row) => formatDate(row.expiryDate) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <ExpiryBadge cert={row} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          {row.s3Key && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const { url } = await certificatesApi.getDownloadUrl(row.id);
                  window.open(url, '_blank');
                } catch {
                  toast.error('Failed to get download URL');
                }
              }}
              className="text-xs text-brand-600 hover:underline"
            >
              Download
            </button>
          )}
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filtered = certs.filter(
    (c) => !search || c.store?.name?.toLowerCase().includes(search.toLowerCase()) || c.certificateType.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Certificates</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} certificates</p>
        </div>
        {canManage && (
          <button
            onClick={() => router.push('/dashboard/certificates/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Add Certificate
          </button>
        )}
        {isStore && (
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Upload size={16} /> Upload Certificate
          </button>
        )}
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['all', 'expiring', 'expired'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                filter === f ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              {f === 'all' ? 'All' : f === 'expiring' ? 'Expiring Soon' : 'Expired'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-48"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyMessage="No certificates found."
      />

      {filter === 'all' && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}

      {showUpload && myStoreId && (
        <UploadCertificateModal
          storeId={myStoreId}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); load(); }}
        />
      )}
    </div>
  );
}
