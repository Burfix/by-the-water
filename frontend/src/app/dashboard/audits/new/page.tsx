'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { Store } from '@/types';
import { auditsApi, storesApi } from '@/lib/api';

const AUDIT_TYPES = ['Health & Safety', 'Food Standards', 'Fire Safety', 'General Compliance', 'BOH Inspection', 'Electrical', 'Gas Safety'];

export default function NewAuditPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    storeId: '',
    auditType: AUDIT_TYPES[0],
    scheduledDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    storesApi
      .getAll({ limit: 100 })
      .then((res) => {
        setStores(res.data);
        if (res.data.length > 0) setForm((f) => ({ ...f, storeId: res.data[0].id }));
      })
      .catch(() => toast.error('Could not load stores'))
      .finally(() => setLoadingStores(false));
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.storeId) { toast.error('Please select a store'); return; }
    if (!form.scheduledDate) { toast.error('Please set a scheduled date'); return; }
    setSubmitting(true);
    try {
      const audit = await auditsApi.create({
        storeId: form.storeId,
        auditType: form.auditType,
        scheduledDate: form.scheduledDate,
        notes: form.notes || undefined,
      });
      toast.success('Audit created!');
      router.push(`/dashboard/audits/${audit.id}`);
    } catch {
      toast.error('Failed to create audit. Please try again.');
      setSubmitting(false);
    }
  };

  const selectedStore = stores.find((s) => s.id === form.storeId);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/audits" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Audit</h1>
          <p className="text-sm text-gray-400 mt-0.5">Schedule a compliance audit for a store</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Store selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Audit Details</h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Store *</label>
            {loadingStores ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 h-10">
                <Loader size={14} className="animate-spin" />Loading stores…
              </div>
            ) : (
              <select value={form.storeId} onChange={set('storeId')} className="input w-full" required>
                <option value="">Select a store…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.storeCode})</option>
                ))}
              </select>
            )}
          </div>

          {selectedStore && (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-4">
              {selectedStore.city && <span>📍 {selectedStore.city}</span>}
              {selectedStore.complianceScore != null && (
                <span>Last score: <span className={selectedStore.complianceScore >= 80 ? 'text-green-600 font-medium' : selectedStore.complianceScore >= 60 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>{selectedStore.complianceScore}%</span></span>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Audit Type *</label>
            <select value={form.auditType} onChange={set('auditType')} className="input w-full" required>
              {AUDIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Scheduled Date *</label>
            <input
              type="date"
              value={form.scheduledDate}
              onChange={set('scheduledDate')}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes <span className="text-gray-300">(optional)</span></label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="input w-full resize-none"
              placeholder="Any instructions or context for the auditor…"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
            <ClipboardList size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-900">
              {selectedStore ? selectedStore.name : 'No store selected'}
            </p>
            <p className="text-xs text-brand-600 mt-0.5">
              {form.auditType} · {form.scheduledDate ? new Date(form.scheduledDate + 'T12:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date set'}
            </p>
          </div>
          <p className="text-xs text-brand-500 flex-shrink-0">Will be created as DRAFT</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/audits" className="btn-secondary text-sm">Cancel</Link>
          <button
            type="submit"
            disabled={submitting || loadingStores || !form.storeId}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {submitting ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            Create Audit
          </button>
        </div>
      </form>
    </div>
  );
}
