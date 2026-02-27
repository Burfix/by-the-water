import { AuditStatus } from '@/types';
import { cn, auditStatusColor } from '@/lib/utils';

const STATUS_LABELS: Record<AuditStatus, string> = {
  [AuditStatus.DRAFT]: 'Draft',
  [AuditStatus.IN_PROGRESS]: 'In Progress',
  [AuditStatus.SUBMITTED]: 'Submitted',
  [AuditStatus.APPROVED]: 'Approved',
  [AuditStatus.REJECTED]: 'Rejected',
};

interface AuditStatusBadgeProps {
  status: AuditStatus;
}

export function AuditStatusBadge({ status }: AuditStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        auditStatusColor(status),
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
