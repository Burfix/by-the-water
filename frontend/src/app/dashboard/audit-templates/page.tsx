'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Upload, Edit2, Trash2, Copy, ClipboardEdit, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuditTemplate } from '@/types';
import { getTemplates, deleteTemplate, duplicateTemplate } from '@/lib/templateStore';
import { ImportPDFModal } from '@/components/templates/ImportPDFModal';

const RISK_COLORS = { LOW: 'bg-green-50 text-green-600', MEDIUM: 'bg-yellow-50 text-yellow-600', HIGH: 'bg-orange-50 text-orange-600', CRITICAL: 'bg-red-50 text-red-600' };

function getRiskSummary(template: AuditTemplate) {
  const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  template.sections.forEach((s) => s.questions.forEach((q) => counts[q.riskLevel]++));
  return counts;
}

export default function AuditTemplatesPage() {
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const reload = () => setTemplates(getTemplates());
  useEffect(() => { reload(); }, []);

  const handleDelete = (t: AuditTemplate) => {
    if (!confirm(`Delete template "${t.name}"? This cannot be undone.`)) return;
    deleteTemplate(t.id);
    toast.success('Template deleted');
    reload();
  };

  const handleDuplicate = (t: AuditTemplate) => {
    const copy = duplicateTemplate(t.id);
    if (copy) { toast.success(`Duplicated as "${copy.name}"`); reload(); }
  };

  const totalQ = (t: AuditTemplate) => t.sections.reduce((a, s) => a + s.questions.length, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage reusable audit checklists for your stores</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Upload size={15} />
            Import PDF
          </button>
          <Link href="/dashboard/audit-templates/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} />
            New Template
          </Link>
        </div>
      </div>

      {/* Template grid */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-24 text-center">
          <ClipboardEdit size={44} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">No templates yet</h3>
          <p className="text-sm text-gray-400 mb-6">Create a template or import one from a PDF</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2 text-sm">
              <Upload size={14} />Import PDF
            </button>
            <Link href="/dashboard/audit-templates/new" className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} />New Template
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => {
            const risk = getRiskSummary(t);
            const qCount = totalQ(t);
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-brand-200 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">{t.name}</h3>
                      {t.isActive ? (
                        <span className="badge badge-success text-xs flex-shrink-0">Active</span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-500 text-xs flex-shrink-0">Inactive</span>
                      )}
                    </div>
                    {t.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{t.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                      <span>{t.sections.length} sections</span>
                      <span>·</span>
                      <span>{qCount} questions</span>
                      <span>·</span>
                      <span>Updated {new Date(t.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {/* Risk breakdown */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {risk.CRITICAL > 0 && <span className="text-xs rounded-full px-2 py-0.5 bg-red-50 text-red-600 font-medium">{risk.CRITICAL} Critical</span>}
                      {risk.HIGH > 0 && <span className="text-xs rounded-full px-2 py-0.5 bg-orange-50 text-orange-600 font-medium">{risk.HIGH} High</span>}
                      {risk.MEDIUM > 0 && <span className="text-xs rounded-full px-2 py-0.5 bg-yellow-50 text-yellow-600 font-medium">{risk.MEDIUM} Medium</span>}
                      {risk.LOW > 0 && <span className="text-xs rounded-full px-2 py-0.5 bg-green-50 text-green-600 font-medium">{risk.LOW} Low</span>}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setMenuOpen(menuOpen === t.id ? null : t.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuOpen === t.id && (
                      <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-40" onClick={() => setMenuOpen(null)}>
                        <Link href={`/dashboard/audit-templates/${t.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Edit2 size={14} />Edit
                        </Link>
                        <button onClick={() => handleDuplicate(t)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Copy size={14} />Duplicate
                        </button>
                        <button onClick={() => handleDelete(t)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                          <Trash2 size={14} />Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                  <Link href={`/dashboard/audit-templates/${t.id}`} className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    <Edit2 size={12} />Edit Template
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Click outside to close menu */}
      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}

      {showImport && (
        <ImportPDFModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { reload(); setShowImport(false); }}
        />
      )}
    </div>
  );
}
