'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Award, Bell, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Store, Audit, Certificate, Notification } from '@/types';
import { storesApi, auditsApi, certificatesApi, notificationsApi } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { AuditStatusBadge } from '@/components/ui/AuditStatusBadge';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';

export default function StoreDashboard() {
  const [store, setStore] = useState<Store | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      storesApi.getMyStore(),
      auditsApi.getAll({ limit: 5 }),
      certificatesApi.getAll({ limit: 10 }),
      notificationsApi.getAll({ limit: 5 }),
    ])
      .then(([s, a, c, n]) => {
        setStore(s);
        setAudits(a.data);
        setCerts(c.data);
        setNotifications(n.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{store?.name ?? 'My Store'}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Store code: {store?.storeCode}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Compliance Score"
          value={store?.complianceScore != null ? `${store.complianceScore.toFixed(1)}%` : '—'}
          icon={<TrendingUp size={20} />}
          colorClass="bg-brand-50 text-brand-600"
        />
        <StatCard label="Total Audits" value={audits.length} icon={<ClipboardList size={20} />} colorClass="bg-warning-50 text-warning-600" />
        <StatCard label="Certificates" value={certs.length} icon={<Award size={20} />} colorClass="bg-success-50 text-success-600" />
        <StatCard label="Notifications" value={notifications.filter((n) => !n.isRead).length} icon={<Bell size={20} />} colorClass="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audits */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Audits</h2>
            <Link href="/dashboard/audits" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {audits.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No audits yet.</p>
            ) : audits.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/audits/${a.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.auditType ?? 'General Audit'}</p>
                  <p className="text-xs text-gray-400">{formatDate(a.scheduledDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {a.complianceScore != null && <ScoreBadge score={a.complianceScore} size="sm" />}
                  <AuditStatusBadge status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Certificates */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Certificates</h2>
            <Link href="/dashboard/certificates" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {certs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No certificates yet.</p>
            ) : certs.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.certificateType}</p>
                  <p className="text-xs text-gray-400">Expires {formatDate(c.expiryDate)}</p>
                </div>
                <span
                  className={
                    c.isExpired
                      ? 'badge-danger'
                      : c.isExpiringSoon
                      ? 'badge-warning'
                      : 'badge-success'
                  }
                >
                  {c.isExpired ? 'Expired' : c.isExpiringSoon ? `${c.daysUntilExpiry}d` : 'Valid'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Notifications</h2>
          <Link href="/dashboard/notifications" className="text-sm text-brand-600 hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No notifications.</p>
          ) : notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-lg text-sm ${n.isRead ? 'text-gray-500' : 'bg-brand-50 text-gray-900 font-medium'}`}
            >
              {n.message}
              <span className="block text-xs text-gray-400 mt-0.5">{formatDate(n.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
