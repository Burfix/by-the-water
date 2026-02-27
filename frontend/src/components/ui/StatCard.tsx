import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; label?: string };
  colorClass?: string;
  loading?: boolean;
}

export function StatCard({ label, value, icon, trend, colorClass = 'bg-brand-50 text-brand-600', loading = false }: StatCardProps) {
  return (
    <div className="card flex items-start gap-4">
      {icon && (
        <div className={cn('p-2.5 rounded-xl shrink-0', colorClass)}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{label}</p>
        {loading ? (
          <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        )}
        {trend && (
          <p className={cn('text-xs mt-1', trend.value >= 0 ? 'text-success-600' : 'text-danger-600')}>
            {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}%
            {trend.label && <span className="text-gray-400 ml-1">{trend.label}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
