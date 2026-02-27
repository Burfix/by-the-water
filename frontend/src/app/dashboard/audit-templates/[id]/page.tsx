'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuditTemplate } from '@/types';
import { getTemplateById, saveTemplate } from '@/lib/templateStore';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<AuditTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const t = getTemplateById(id);
    if (!t) { setNotFound(true); return; }
    setTemplate(t);
  }, [id]);

  const handleSave = () => {
    if (!template) return;
    if (!template.name.trim()) { toast.error('Template name is required'); return; }
    setSaving(true);
    saveTemplate({ ...template, updatedAt: new Date().toISOString() });
    toast.success('Template saved');
    setSaving(false);
    router.push('/dashboard/audit-templates');
  };

  if (notFound) return (
    <div className="p-8 text-center">
      <p className="text-gray-500 mb-4">Template not found.</p>
      <Link href="/dashboard/audit-templates" className="btn-secondary text-sm">Back to Templates</Link>
    </div>
  );

  if (!template) return (
    <div className="p-8 flex justify-center">
      <Loader size={24} className="animate-spin text-gray-400" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/audit-templates" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Edit Template</h1>
            <p className="text-xs text-gray-400 truncate max-w-xs">{template.name}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
          {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </div>
      <TemplateBuilder template={template} onChange={setTemplate} />
    </div>
  );
}
