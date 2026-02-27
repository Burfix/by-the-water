'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuditTemplate } from '@/types';
import { createTemplate, saveTemplate } from '@/lib/templateStore';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';

function blankTemplate(): AuditTemplate {
  return createTemplate('Untitled Template', '');
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [template, setTemplate] = useState<AuditTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setTemplate(blankTemplate()); }, []);

  const handleSave = () => {
    if (!template) return;
    if (!template.name.trim()) { toast.error('Template name is required'); return; }
    setSaving(true);
    saveTemplate(template);
    toast.success('Template created!');
    setSaving(false);
    router.push('/dashboard/audit-templates');
  };

  if (!template) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/audit-templates" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">New Template</h1>
            <p className="text-xs text-gray-400">Build a reusable audit checklist</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
          {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          Save Template
        </button>
      </div>
      <TemplateBuilder template={template} onChange={setTemplate} />
    </div>
  );
}
