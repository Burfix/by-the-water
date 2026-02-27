'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2, FileText, ShieldCheck, ChevronRight,
  Upload, Download, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { storesApi, auditsApi, certificatesApi } from '@/lib/api';
import { Store, Audit, Certificate } from '@/types';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { AuditStatusBadge } from '@/components/ui/AuditStatusBadge';
import { UploadCertificateModal } from '@/components/certificates/UploadCertificateModal';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

function ExpiryBadge({ cert }: { cert: Certificate }) {
  if (cert.isExpired) return <span className="badge-danger text-xs">Expired</span>;
  if (cert.isExpiringSoon) return <span className="badge-warning text-xs">{cert.daysUntilExpiry}d left</span>;
  return <span className="badge-success text-xs">Valid</span>;
}

export default function MyStorePage() {
  const [store, setStore] = useState<Store | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await storesApi.getMyStore();
      setStore(s);
      const [auditResult, certResult] = await Promise.all([
        auditsApi.getAll({ storeId: s.id, limit: 5, page: 1 }),
        certificatesApi.getAll({ storeId: s.id, limit: 20, page: 1 }),
      ]);
      setAudits(auditResult.data);
      setCerts(certResult.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;
  if (!store) return (
    <div className="text-center py-16">
      <p className="text-gray-500">No store assigned to your account.</p>
      <p className="text-sm text-gray-400 mt-2">Contact your Ops Manager to assign you to a store.</p>
    </div>
  );

  const expiredCerts = certs.filter((c) => c.isExpired);
  const expiringSoon = certs.filter((c) => c.isExpiringSoon && !c.isExpired);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Building2 size={24} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
            <p className="text-sm text-gray-400">
              {store.storeCode} · {store.precinct?.name} · {store.city}
            </p>
          </div>
        </div>
        {store.complianceScore != null && (
          <ScoreBadge score={store.complianceScore} size="lg" showLabel />
        )}
      </div>

      {/* ── Certificate alerts ── */}
      {(expiredCerts.length > 0 || expiringSoon.length > 0) && (
        <div
          className={cn(
            'rounded-xl p-4 flex items-start gap-3',
            expiredCerts.length > 0
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200',
          )}
        >
          <AlertTriangle
            size={18}
            className={cn(
              'mt-0.5 flex-shrink-0',
              expiredCerts.length > 0 ? 'text-red-500' : 'text-yellow-500',
            )}
          />
          <div className="space-y-0.5">
            {expiredCerts.length > 0 && (
              <p className="text-sm font-medium text-red-800">
                {expiredCerts.length} certificate{expiredCerts.length > 1 ? 's' : ''} expired —{' '}
                upload renewed certificates immediately.
              </p>
            )}
            {expiringSoon.length > 0 && (
              <p className="text-sm font-medium text-yellow-800">
                {expiringSoon.length} certificate{expiringSoon.length > 1 ? 's' : ''} expiring within 30 days.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Two-column: store info + recent audits ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ShieldCheck size={16} className="text-brand-500" /> Store Information
          </h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Precinct', store.precinct?.name],
              ['Region', store.precinct?.region],
              ['City', store.city],
              ['Address', store.address],
              ['Status', store.isActive ? 'Active' : 'Inactive'],
              ['Compliance Score', store.complianceScore != null ? `${store.complianceScore}%` : '—'],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
                <dd className="font-medium text-gray-800">{value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Recent audits */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={16} className="text-brand-500" /> My Audits
            </h2>
            <Link
              href="/dashboard/audits"
              className="text-xs text-brand-600 hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {audits.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No audits scheduled yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {audits.map((a) => (
                <Link
                  key={a.id}
                  href={`/dashboard/audits/${a.id}`}
                  className="flex items-center justify-between py-2.5 -mx-3 px-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.auditType ?? 'General Audit'}</p>
                    <p className="text-xs text-gray-400">{formatDate(a.scheduledDate)}</p>
                  </div>
                  <AuditStatusBadge status={a.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Certificates ── */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ShieldCheck size={16} className="text-brand-500" /> My Certificates
          </h2>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Upload size={15} /> Upload Certificate
          </button>
        </div>

        {certs.length === 0 ? (
          <div className="py-8 text-center">
            <ShieldCheck size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No certificates uploaded yet</p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-3 text-sm text-brand-600 hover:underline"
            >
              Upload your first certificate
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Type', 'Issue Date', 'Expiry Date', 'Status', ''].map((h) => (
                    <th key={h} className="text-left py-2 text-xs text-gray-400 font-medium pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {certs.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-medium text-gray-800 pr-4">{c.certificateType}</td>
                    <td className="py-3 text-gray-600 pr-4">{formatDate(c.issueDate)}</td>
                    <td className="py-3 text-gray-600 pr-4">{formatDate(c.expiryDate)}</td>
                    <td className="py-3 pr-4"><ExpiryBadge cert={c} /></td>
                    <td className="py-3 text-right">
                      <button
                        onClick={async () => {
                          try {
                            const { url } = await certificatesApi.getDownloadUrl(c.id);
                            window.open(url, '_blank');
                          } catch {
                            toast.error('Download failed');
                          }
                        }}
                        className="text-xs text-brand-600 hover:underline flex items-center gap-1 ml-auto"
                      >
                        <Download size={13} /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Upload modal ── */}
      {showUpload && (
        <UploadCertificateModal
          storeId={store.id}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); load(); }}
        />
      )}
    </div>
  );
}
