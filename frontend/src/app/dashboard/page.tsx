'use client';

import { useEffect, useState } from 'react';
import {
  Store, ClipboardList, Award, AlertTriangle, TrendingUp, CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardMetrics } from '@/types';
import { dashboardApi } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { AuditStatusBadge } from '@/components/ui/AuditStatusBadge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ComplianceTrendChart } from '@/components/dashboard/ComplianceTrendChart';
import { PrecinctSummaryChart } from '@/components/dashboard/PrecinctSummaryChart';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [precincts, setPrecincts] = useState<{ name: string; avgScore: number; storeCount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.getMetrics(),
      dashboardApi.getPrecinctSummary(),
    ])
      .then(([m, p]) => {
        setMetrics(m);
        setPrecincts(
          p.map((x) => ({
            name: (x as unknown as { precinctName?: string; name?: string }).precinctName
              ?? (x as unknown as { name?: string }).name
              ?? '—',
            avgScore: x.avgScore,
            storeCount: x.storeCount,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!metrics) return <p className="text-gray-500">Failed to load metrics.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Operations Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Live compliance overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Stores"
          value={metrics.totalStores}
          icon={<Store size={20} />}
          colorClass="bg-brand-50 text-brand-600"
        />
        <StatCard
          label="Pending Audits"
          value={metrics.pendingAudits}
          icon={<ClipboardList size={20} />}
          colorClass="bg-warning-50 text-warning-600"
        />
        <StatCard
          label="Avg Compliance"
          value={`${metrics.avgComplianceScore.toFixed(1)}%`}
          icon={<TrendingUp size={20} />}
          colorClass={metrics.avgComplianceScore >= 75 ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}
        />
        <StatCard
          label="Expiring Certs"
          value={metrics.expiringCertificates}
          icon={<Award size={20} />}
          colorClass="bg-danger-50 text-danger-600"
        />
      </div>

      {/* Second row KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Approved Audits"
          value={metrics.approvedAudits}
          icon={<CheckCircle size={20} />}
          colorClass="bg-success-50 text-success-600"
        />
        <StatCard
          label="Total Audits"
          value={metrics.totalAudits}
          icon={<ClipboardList size={20} />}
          colorClass="bg-gray-100 text-gray-600"
        />
        <StatCard
          label="Expired Certs"
          value={metrics.expiredCertificates}
          icon={<AlertTriangle size={20} />}
          colorClass="bg-danger-50 text-danger-600"
        />
        <StatCard
          label="Coordinators"
          value={metrics.totalCoordinators}
          icon={<Store size={20} />}
          colorClass="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance trend */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Compliance Trend (6 months)</h2>
          {metrics.complianceTrend.length > 0 ? (
            <ComplianceTrendChart data={metrics.complianceTrend} />
          ) : (
            <p className="text-sm text-gray-400 py-10 text-center">No trend data yet.</p>
          )}
        </div>

        {/* Precinct breakdown */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Compliance by Precinct</h2>
          {precincts.length > 0 ? (
            <PrecinctSummaryChart data={precincts} />
          ) : (
            <p className="text-sm text-gray-400 py-10 text-center">No precinct data yet.</p>
          )}
        </div>
      </div>

      {/* Audits by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Audits</h2>
            <Link href="/dashboard/audits" className="text-sm text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {metrics.recentAudits.slice(0, 5).map((audit) => (
              <Link
                key={audit.id}
                href={`/dashboard/audits/${audit.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                    {audit.store?.name ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(audit.scheduledDate)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {audit.complianceScore != null && (
                    <ScoreBadge score={audit.complianceScore} size="sm" />
                  )}
                  <AuditStatusBadge status={audit.status} />
                </div>
              </Link>
            ))}
            {metrics.recentAudits.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No audits yet.</p>
            )}
          </div>
        </div>

        {/* Top & bottom stores */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Store Performance</h2>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-success-600 uppercase tracking-wide mb-2">Top Performers</p>
            {metrics.topStores.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/stores/${s.id}`}
                className="flex items-center justify-between py-2 px-2 rounded hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700 truncate max-w-[180px]">{s.name}</span>
                <ScoreBadge score={s.complianceScore ?? 0} size="sm" />
              </Link>
            ))}

            <div className="border-t border-gray-100 my-2" />
            <p className="text-xs font-semibold text-danger-600 uppercase tracking-wide mb-2">Needs Attention</p>
            {metrics.lowStores.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/stores/${s.id}`}
                className="flex items-center justify-between py-2 px-2 rounded hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700 truncate max-w-[180px]">{s.name}</span>
                <ScoreBadge score={s.complianceScore ?? 0} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
