'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Bell, CheckCheck } from 'lucide-react';
import { Notification } from '@/types';
import { notificationsApi } from '@/lib/api';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationsApi.getAll({ page, limit: PAGE_SIZE });
      setNotifications(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function markRead(id: string) {
    await notificationsApi.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You're all caught up!"
          icon={<Bell size={40} />}
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={cn(
                'p-4 rounded-xl border transition-colors',
                n.isRead
                  ? 'bg-white border-gray-200 cursor-default'
                  : 'bg-brand-50 border-brand-200 cursor-pointer hover:bg-brand-100',
              )}
            >
              <div className="flex items-start gap-3">
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className={cn('text-sm', n.isRead ? 'text-gray-600' : 'text-gray-900 font-medium')}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
