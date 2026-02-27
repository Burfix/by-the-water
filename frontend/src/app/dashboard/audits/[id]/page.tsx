'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Play, Send, Image, ClipboardEdit } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Audit, AuditStatus, AuditItemResult, Role } from '@/types';
import { auditsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { AuditStatusBadge } from '@/components/ui/AuditStatusBadge';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';

const RESULT_LABELS: Record<AuditItemResult, string> = {
  [AuditItemResult.PASS]: 'Pass',
  [AuditItemResult.FAIL]: 'Fail',
  [AuditItemResult.NOT_APPLICABLE]: 'N/A',
  [AuditItemResult.PENDING]: 'Pending',
};

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await auditsApi.getById(id);
      setAudit(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAction(action: () => Promise<Audit>) {
    setActionLoading(true);
    try {
      const updated = await action();
      setAudit(updated);
      toast.success('Audit updated successfully');
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!audit) return <p className="text-gray-500">Audit not found.</p>;

  const isOps = user?.role === Role.OPS_MANAGER;
  const isCoordinator = user?.role === Role.PROPERTY_COORDINATOR;

  const passCount = audit.items?.filter((i) => i.result === AuditItemResult.PASS).length ?? 0;
  const failCount = audit.items?.filter((i) => i.result === AuditItemResult.FAIL).length ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-700 mt-0.5">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{audit.store?.name} — Audit</h1>
            <AuditStatusBadge status={audit.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Scheduled: {formatDate(audit.scheduledDate)}
            {audit.auditor && ` · Auditor: ${audit.auditor.firstName} ${audit.auditor.lastName}`}
          </p>
        </div>
        {audit.complianceScore != null && (
          <ScoreBadge score={audit.complianceScore} size="lg" />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {audit.status === AuditStatus.DRAFT && isCoordinator && (
          <button
            disabled={actionLoading}
            onClick={() => handleAction(() => auditsApi.start(audit.id))}
            className="btn-primary flex items-center gap-2"
          >
            <Play size={16} /> Start Audit
          </button>
        )}
        {audit.status === AuditStatus.IN_PROGRESS && isCoordinator && (
          <>
            <Link
              href={`/dashboard/audits/${audit.id}/conduct`}
              className="btn-primary flex items-center gap-2"
            >
              <ClipboardEdit size={16} /> Conduct Audit
            </Link>
            <button
              disabled={actionLoading}
              onClick={() => handleAction(() => auditsApi.submit(audit.id))}
              className="btn-secondary flex items-center gap-2"
            >
              <Send size={16} /> Submit Audit
            </button>
          </>
        )}
        {audit.status === AuditStatus.SUBMITTED && isOps && (
          <>
            <button
              disabled={actionLoading}
              onClick={() => handleAction(() => auditsApi.approve(audit.id))}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircle size={16} /> Approve
            </button>
            <button
              disabled={actionLoading}
              onClick={() => setShowRejectForm(true)}
              className="btn-danger flex items-center gap-2"
            >
              <XCircle size={16} /> Reject
            </button>
          </>
        )}
      </div>

      {/* Rejection form */}
      {showRejectForm && (
        <div className="card border-danger-200">
          <h3 className="font-semibold text-danger-700 mb-2">Rejection Reason</h3>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="input w-full h-24 resize-none"
            placeholder="Explain why this audit is being rejected..."
          />
          <div className="flex gap-2 mt-3">
            <button
              disabled={!rejectionReason.trim() || actionLoading}
              onClick={() =>
                handleAction(() => auditsApi.reject(audit.id, rejectionReason)).then(() =>
                  setShowRejectForm(false),
                )
              }
              className="btn-danger"
            >
              Confirm Reject
            </button>
            <button onClick={() => setShowRejectForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rejection reason display */}
      {audit.rejectionReason && (
        <div className="card border-l-4 border-l-danger-400 bg-danger-50">
          <p className="text-sm font-semibold text-danger-700">Rejection Reason</p>
          <p className="text-sm text-danger-600 mt-1">{audit.rejectionReason}</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-success-600">{passCount}</p>
          <p className="text-xs text-gray-500 mt-1">Passed</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-danger-600">{failCount}</p>
          <p className="text-xs text-gray-500 mt-1">Failed</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-600">{audit.items?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Total Items</p>
        </div>
      </div>

      {/* Checklist */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Checklist Items</h2>
        {!audit.items?.length ? (
          <p className="text-sm text-gray-400 text-center py-6">No checklist items.</p>
        ) : (
          <div className="space-y-2">
            {audit.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.question}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.category} · Weight: {item.weight}</p>
                  {item.notes && (
                    <p className="text-xs text-gray-500 mt-1 italic">"{item.notes}"</p>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold shrink-0 px-2 py-1 rounded-full ${
                    item.result === AuditItemResult.PASS
                      ? 'bg-success-100 text-success-700'
                      : item.result === AuditItemResult.FAIL
                      ? 'bg-danger-100 text-danger-700'
                      : item.result === AuditItemResult.NOT_APPLICABLE
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-warning-100 text-warning-700'
                  }`}
                >
                  {RESULT_LABELS[item.result]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photos */}
      {(audit.photos?.length ?? 0) > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Image size={18} /> Photos ({audit.photos!.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {audit.photos!.map((photo) => (
              <div key={photo.id} className="rounded-lg overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
                <span className="text-xs text-gray-400">{photo.fileName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
