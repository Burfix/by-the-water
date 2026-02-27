'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuditTemplate, TemplateSection, TemplateQuestion, RiskLevel } from '@/types';
import { saveTemplate } from '@/lib/templateStore';
import { cn } from '@/lib/utils';

const RISK_COLORS: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

interface ParsedQuestion { text: string; riskLevel: string; }
interface ParsedSection { title: string; questions: ParsedQuestion[]; }

function uid() { return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function qid() { return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
function sid() { return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

interface Props { onClose: () => void; onSuccess: (template: AuditTemplate) => void; }

export function ImportPDFModal({ onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [sections, setSections] = useState<ParsedSection[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [isDrag, setDrag] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    if (!f.name.match(/\.pdf$/i)) { toast.error('Please upload a PDF file'); return; }
    setFile(f);
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/v1/audit-templates/parse-pdf', { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setSections(json.data.sections);
      setTemplateName(f.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim());
      toast.success(`Parsed ${json.data.sections.length} sections`);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to parse PDF');
      setFile(null);
    } finally { setParsing(false); }
  };

  const updateSection = (i: number, key: keyof ParsedSection, val: string) => {
    setSections((prev) => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
  };

  const updateQuestion = (si: number, qi: number, key: keyof ParsedQuestion, val: string) => {
    setSections((prev) => prev.map((s, idx) =>
      idx === si ? { ...s, questions: s.questions.map((q, j) => j === qi ? { ...q, [key]: val } : q) } : s,
    ));
  };

  const removeQuestion = (si: number, qi: number) => {
    setSections((prev) => prev.map((s, idx) =>
      idx === si ? { ...s, questions: s.questions.filter((_, j) => j !== qi) } : s,
    ));
  };

  const totalQ = sections.reduce((acc, s) => acc + s.questions.length, 0);

  const handleSave = () => {
    if (!templateName.trim()) { toast.error('Template name is required'); return; }
    if (totalQ === 0) { toast.error('No questions parsed'); return; }
    setSaving(true);
    const now = new Date().toISOString();
    const template: AuditTemplate = {
      id: uid(),
      name: templateName,
      sections: sections.map((s, si): TemplateSection => ({
        id: sid(),
        title: s.title,
        sortOrder: si,
        questions: s.questions.map((q, qi): TemplateQuestion => ({
          id: qid(),
          text: q.text,
          riskLevel: (q.riskLevel as RiskLevel) || 'MEDIUM',
          requiresPhoto: false,
          requiresNotes: false,
          weight: q.riskLevel === 'CRITICAL' ? 10 : q.riskLevel === 'HIGH' ? 8 : q.riskLevel === 'MEDIUM' ? 5 : 3,
          sortOrder: qi,
        })),
      })),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    saveTemplate(template);
    toast.success(`Template "${templateName}" created with ${totalQ} questions`);
    onSuccess(template);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Import Template from PDF</h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload a completed audit PDF — we'll extract sections & questions automatically</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} className="text-gray-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={cn('border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-colors',
                isDrag ? 'border-brand-400 bg-brand-50/40' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50')}
            >
              <FileText size={44} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-700">Drag & drop your PDF, or <span className="text-brand-600">click to browse</span></p>
              <p className="text-xs text-gray-400 mt-1">Supports text-based PDF audit forms</p>
            </div>
          ) : parsing ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-700">Parsing {file.name}…</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle size={15} />
                  <span className="font-medium">{sections.length} sections · {totalQ} questions found</span>
                </div>
                <button onClick={() => { setFile(null); setSections([]); }} className="text-xs text-gray-400 hover:text-gray-600 underline ml-auto">Re-upload</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="input w-full" placeholder="e.g. BOH Health & Safety Audit" />
              </div>

              <div className="space-y-4">
                {sections.map((section, si) => (
                  <div key={si} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center gap-3">
                      <input
                        value={section.title}
                        onChange={(e) => updateSection(si, 'title', e.target.value)}
                        className="flex-1 text-sm font-semibold bg-transparent border-none outline-none"
                      />
                      <span className="text-xs text-gray-400">{section.questions.length} questions</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {section.questions.map((q, qi) => (
                        <div key={qi} className="px-4 py-3 flex items-start gap-3">
                          <input
                            value={q.text}
                            onChange={(e) => updateQuestion(si, qi, 'text', e.target.value)}
                            className="flex-1 text-sm border-none outline-none bg-transparent text-gray-700"
                          />
                          <select
                            value={q.riskLevel}
                            onChange={(e) => updateQuestion(si, qi, 'riskLevel', e.target.value)}
                            className={cn('text-xs rounded-full px-2.5 py-1 font-medium border-none outline-none cursor-pointer', RISK_COLORS[q.riskLevel] || 'bg-gray-100 text-gray-600')}
                          >
                            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button onClick={() => removeQuestion(si, qi)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {totalQ === 0 && (
                <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 rounded-xl p-4">
                  <AlertCircle size={16} />
                  <p>No questions could be detected. This may be a scanned/image PDF. Try a text-based PDF.</p>
                </div>
              )}
            </>
          )}
        </div>

        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

        <div className="flex items-center justify-between p-5 border-t border-gray-100 flex-shrink-0">
          <p className="text-sm text-gray-400">{totalQ > 0 ? `Ready to create template with ${totalQ} questions` : 'Upload a PDF to get started'}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={totalQ === 0 || saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={14} />}
              Create Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
