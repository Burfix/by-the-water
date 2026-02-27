'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Award, Store, Bell } from 'lucide-react';
import Link from 'next/link';
import { Audit, Certificate, Store as StoreType, AuditStatus } from '@/types';
import { auditsApi, certificatesApi, storesApi, notificationsApi } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { AuditStatusBadge } from '@/components/ui/AuditStatusBadge';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

export default function CoordinatorDashboard() {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      storesApi.getAll({ limit: 20 }),
      auditsApi.getAll({ limit: 10, status: AuditStatus.SUBMITTED }),
      certificatesApi.getExpiring(30),
      notificationsApi.getUnreadCount(),
    ])
      .then(([s, a, c, u]) => {
        setStores(s.data);
        setAudits(a.data);
        setCerts(c);
        setUnread(u);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const pendingAudits = audits.filter((a) =>
    [AuditStatus.DRAFT, AuditStatus.IN_PROGRESS].includes(a.status),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Coordinator Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your stores and audits at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned Stores" value={stores.length} icon={<Store size={20} />} colorClass="bg-brand-50 text-brand-600" />
        <StatCard label="Pending Audits" value={pendingAudits.length} icon={<ClipboardList size={20} />} colorClass="bg-warning-50 text-warning-600" />
        <StatCard label="Expiring Certs" value={certs.length} icon={<Award size={20} />} colorClass="bg-danger-50 text-danger-600" />
        <StatCard label="Notifications" value={unread} icon={<Bell size={20} />} colorClass="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned stores */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">My Stores</h2>
            <Link href="/dashboard/stores" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {stores.length === 0 ? (
            <EmptyState title="No stores assigned" />
          ) : (
            <div className="space-y-2">
              {stores.slice(0, 6).map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/stores/${s.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.storeCode}</p>
                  </div>
                  {s.complianceScore != null && (
                    <ScoreBadge score={s.complianceScore} size="sm" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent audits */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Audits</h2>
            <Link href="/dashboard/audits" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {audits.length === 0 ? (
            <EmptyState title="No audits found" />
          ) : (
            <div className="space-y-2">
              {audits.slice(0, 6).map((a) => (
                <Link
                  key={a.id}
                  href={`/dashboard/audits/${a.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{a.store?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{formatDate(a.scheduledDate)}</p>
                  </div>
                  <AuditStatusBadge status={a.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expiring certs */}
      {certs.length > 0 && (
        <div className="card border-l-4 border-l-warning-400">
          <h2 className="text-base font-semibold text-gray-900 mb-3">⚠️ Certificates Expiring Soon</h2>
          <div className="space-y-2">
            {certs.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{c.store?.name ?? '—'} — {c.certificateType}</span>
                <span className="text-warning-600 font-medium">{c.daysUntilExpiry}d left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
