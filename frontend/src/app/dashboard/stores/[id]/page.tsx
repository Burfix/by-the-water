'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Store } from '@/types';
import { storesApi, auditsApi, certificatesApi } from '@/lib/api';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { AuditStatusBadge } from '@/components/ui/AuditStatusBadge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storesApi.getById(id)
      .then(setStore)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!store) return <p className="text-gray-500">Store not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
          <p className="text-sm text-gray-400">{store.storeCode}</p>
        </div>
        {store.complianceScore != null && (
          <ScoreBadge score={store.complianceScore} size="lg" showLabel />
        )}
      </div>

      {/* Info card */}
      <div className="card grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Precinct</p>
          <p className="font-medium text-gray-900">{store.precinct?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Region</p>
          <p className="font-medium text-gray-900">{store.precinct?.region ?? '—'}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">City</p>
          <p className="font-medium text-gray-900">{store.city ?? '—'}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Address</p>
          <p className="font-medium text-gray-900">{store.address ?? '—'}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Status</p>
          <span className={store.isActive ? 'badge-success' : 'badge-danger'}>
            {store.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-3 flex-wrap">
        <Link href={`/dashboard/audits?storeId=${store.id}`} className="btn-secondary text-sm">
          View Audits
        </Link>
        <Link href={`/dashboard/certificates?storeId=${store.id}`} className="btn-secondary text-sm">
          View Certificates
        </Link>
      </div>
    </div>
  );
}
