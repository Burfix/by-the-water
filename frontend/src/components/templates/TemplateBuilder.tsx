'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Camera, FileText, AlertTriangle } from 'lucide-react';
import { AuditTemplate, TemplateSection, TemplateQuestion, RiskLevel } from '@/types';
import { cn } from '@/lib/utils';

const RISK_OPTIONS: { value: RiskLevel; label: string; cls: string }[] = [
  { value: 'LOW', label: 'Low', cls: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'MEDIUM', label: 'Medium', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'HIGH', label: 'High', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'CRITICAL', label: 'Critical', cls: 'bg-red-100 text-red-700 border-red-200' },
];

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function makeQuestion(sortOrder: number): TemplateQuestion {
  return { id: uid('q'), text: '', riskLevel: 'MEDIUM', requiresPhoto: false, requiresNotes: false, weight: 5, sortOrder };
}

function makeSection(sortOrder: number): TemplateSection {
  return { id: uid('s'), title: 'New Section', questions: [], sortOrder };
}

interface Props {
  template: AuditTemplate;
  onChange: (t: AuditTemplate) => void;
}

export function TemplateBuilder({ template, onChange }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const update = (patch: Partial<AuditTemplate>) => onChange({ ...template, ...patch });

  const updateSection = (id: string, patch: Partial<TemplateSection>) =>
    update({ sections: template.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  const updateQuestion = (sectionId: string, qId: string, patch: Partial<TemplateQuestion>) =>
    updateSection(sectionId, {
      questions: template.sections
        .find((s) => s.id === sectionId)!.questions
        .map((q) => (q.id === qId ? { ...q, ...patch } : q)),
    });

  const addSection = () => {
    const s = makeSection(template.sections.length);
    update({ sections: [...template.sections, s] });
    setCollapsed((prev) => ({ ...prev, [s.id]: false }));
  };

  const removeSection = (id: string) =>
    update({ sections: template.sections.filter((s) => s.id !== id) });

  const addQuestion = (sectionId: string) => {
    const section = template.sections.find((s) => s.id === sectionId)!;
    const q = makeQuestion(section.questions.length);
    updateSection(sectionId, { questions: [...section.questions, q] });
  };

  const removeQuestion = (sectionId: string, qId: string) => {
    const section = template.sections.find((s) => s.id === sectionId)!;
    updateSection(sectionId, { questions: section.questions.filter((q) => q.id !== qId) });
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const arr = [...template.sections];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    update({ sections: arr.map((s, i) => ({ ...s, sortOrder: i })) });
  };

  const moveQuestion = (sectionId: string, idx: number, dir: -1 | 1) => {
    const section = template.sections.find((s) => s.id === sectionId)!;
    const arr = [...section.questions];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    updateSection(sectionId, { questions: arr.map((q, i) => ({ ...q, sortOrder: i })) });
  };

  const totalQ = template.sections.reduce((a, s) => a + s.questions.length, 0);

  return (
    <div className="space-y-3">
      {/* Template meta */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Template Name *</label>
          <input
            value={template.name}
            onChange={(e) => update({ name: e.target.value })}
            className="input w-full text-base font-semibold"
            placeholder="e.g. BOH Health & Safety Checklist"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
          <textarea
            value={template.description || ''}
            onChange={(e) => update({ description: e.target.value })}
            rows={2}
            className="input w-full resize-none text-sm"
            placeholder="Optional — describe what this audit covers"
          />
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{template.sections.length} sections</span>
            <span className="text-gray-200">·</span>
            <span className="text-sm text-gray-500">{totalQ} questions</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer ml-auto">
            <span className="text-sm text-gray-600">Active</span>
            <button
              type="button"
              onClick={() => update({ isActive: !template.isActive })}
              className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', template.isActive ? 'bg-brand-600' : 'bg-gray-200')}
            >
              <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', template.isActive ? 'translate-x-4' : 'translate-x-1')} />
            </button>
          </label>
        </div>
      </div>

      {/* Sections */}
      {template.sections.map((section, si) => {
        const isOpen = collapsed[section.id] !== true;
        return (
          <div key={section.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/80 border-b border-gray-100 group">
              <div className="flex flex-col gap-0.5 flex-shrink-0 opacity-40 group-hover:opacity-70">
                <button onClick={() => moveSection(si, -1)} disabled={si === 0} className="hover:text-brand-600 disabled:opacity-30 transition-colors">
                  <ChevronDown size={12} className="rotate-180" />
                </button>
                <button onClick={() => moveSection(si, 1)} disabled={si === template.sections.length - 1} className="hover:text-brand-600 disabled:opacity-30 transition-colors">
                  <ChevronDown size={12} />
                </button>
              </div>
              <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
              <button className="flex-shrink-0 text-gray-400" onClick={() => setCollapsed((p) => ({ ...p, [section.id]: isOpen }))}>
                {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
              <input
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                className="flex-1 font-semibold text-sm bg-transparent border-none outline-none text-gray-800"
              />
              <span className="text-xs text-gray-400 flex-shrink-0">{section.questions.length} questions</span>
              <button onClick={() => removeSection(section.id)} className="p-1 rounded-md hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>

            {/* Questions */}
            {isOpen && (
              <div className="divide-y divide-gray-50">
                {section.questions.map((q, qi) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    isFirst={qi === 0}
                    isLast={qi === section.questions.length - 1}
                    onMove={(dir) => moveQuestion(section.id, qi, dir)}
                    onChange={(patch) => updateQuestion(section.id, q.id, patch)}
                    onDelete={() => removeQuestion(section.id, q.id)}
                  />
                ))}
                <div className="px-4 py-3">
                  <button
                    onClick={() => addQuestion(section.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <Plus size={13} />
                    Add Question
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add section */}
      <button
        onClick={addSection}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm font-medium text-gray-400 hover:border-brand-300 hover:text-brand-600 transition-colors"
      >
        <Plus size={15} />
        Add Section
      </button>
    </div>
  );
}

/* ───────── QuestionRow ───────── */
interface QuestionRowProps {
  question: TemplateQuestion;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: -1 | 1) => void;
  onChange: (patch: Partial<TemplateQuestion>) => void;
  onDelete: () => void;
}

function QuestionRow({ question, isFirst, isLast, onMove, onChange, onDelete }: QuestionRowProps) {
  const risk = RISK_OPTIONS.find((r) => r.value === question.riskLevel) || RISK_OPTIONS[1];
  return (
    <div className="px-4 py-3 group hover:bg-gray-50/50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Reorder arrows */}
        <div className="flex flex-col gap-0.5 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity">
          <button onClick={() => onMove(-1)} disabled={isFirst} className="hover:text-brand-600 disabled:opacity-20 transition-colors">
            <ChevronDown size={11} className="rotate-180" />
          </button>
          <button onClick={() => onMove(1)} disabled={isLast} className="hover:text-brand-600 disabled:opacity-20 transition-colors">
            <ChevronDown size={11} />
          </button>
        </div>
        <GripVertical size={13} className="text-gray-200 mt-1 flex-shrink-0 group-hover:text-gray-300 transition-colors" />

        {/* Question text */}
        <textarea
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={2}
          className="flex-1 text-sm border-none outline-none bg-transparent resize-none text-gray-700 placeholder:text-gray-300"
          placeholder="Enter question text…"
        />

        {/* Delete */}
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all flex-shrink-0 mt-0.5">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Controls row */}
      <div className="mt-2 ml-8 flex items-center gap-3 flex-wrap">
        {/* Risk level */}
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={11} className="text-gray-300" />
          <select
            value={question.riskLevel}
            onChange={(e) => onChange({ riskLevel: e.target.value as RiskLevel })}
            className={cn('text-xs rounded-full px-2 py-0.5 font-medium border cursor-pointer outline-none', risk.cls)}
          >
            {RISK_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {/* Toggles */}
        <ToggleChip
          icon={<Camera size={11} />}
          label="Photo"
          active={question.requiresPhoto}
          onClick={() => onChange({ requiresPhoto: !question.requiresPhoto })}
          activeClass="bg-blue-100 text-blue-700 border-blue-200"
        />
        <ToggleChip
          icon={<FileText size={11} />}
          label="Notes"
          active={question.requiresNotes}
          onClick={() => onChange({ requiresNotes: !question.requiresNotes })}
          activeClass="bg-purple-100 text-purple-700 border-purple-200"
        />

        {/* Weight */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-gray-400">Weight</span>
          <input
            type="number"
            min={1}
            max={10}
            value={question.weight}
            onChange={(e) => onChange({ weight: Math.min(10, Math.max(1, Number(e.target.value))) })}
            className="w-10 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-center outline-none focus:border-brand-400"
          />
          <span className="text-xs text-gray-300">/ 10</span>
        </div>
      </div>
    </div>
  );
}

interface ToggleChipProps { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; activeClass: string; }
function ToggleChip({ icon, label, active, onClick, activeClass }: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border transition-colors',
        active ? activeClass : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300',
      )}
    >
      {icon}{label}{active ? ' ✓' : ''}
    </button>
  );
}
