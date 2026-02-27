'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, XCircle, MinusCircle,
  Camera, StickyNote, AlertTriangle, Send, Loader,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuditTemplate, TemplateQuestion, QuestionResponse, QuestionResult, RiskLevel } from '@/types';
import { getTemplates, getResponses, saveResponse, scoreAudit } from '@/lib/templateStore';
import { cn } from '@/lib/utils';

const RISK_CONFIG: Record<RiskLevel, { label: string; cls: string; icon: string }> = {
  LOW: { label: 'Low', cls: 'bg-green-50 text-green-600 border-green-100', icon: '🟢' },
  MEDIUM: { label: 'Medium', cls: 'bg-yellow-50 text-yellow-600 border-yellow-100', icon: '🟡' },
  HIGH: { label: 'High', cls: 'bg-orange-50 text-orange-600 border-orange-100', icon: '🟠' },
  CRITICAL: { label: 'Critical', cls: 'bg-red-50 text-red-600 border-red-100', icon: '🔴' },
};

function scoreColor(s: number) {
  if (s >= 80) return 'text-green-600';
  if (s >= 60) return 'text-yellow-600';
  if (s >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function scoreBarColor(s: number) {
  if (s >= 80) return 'bg-green-500';
  if (s >= 60) return 'bg-yellow-500';
  if (s >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

type ResponseMap = Record<string, QuestionResponse>;

function emptyResponse(questionId: string): QuestionResponse {
  return { questionId, result: null, notes: '', photoDataUrls: [] };
}

export default function ConductAuditPage() {
  const { id: auditId } = useParams<{ id: string }>();
  const router = useRouter();

  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [template, setTemplate] = useState<AuditTemplate | null>(null);
  const [responses, setResponses] = useState<ResponseMap>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoQ, setActivePhotoQ] = useState<string | null>(null);

  useEffect(() => {
    const all = getTemplates().filter((t) => t.isActive);
    setTemplates(all);
    if (all.length > 0) setSelectedTemplateId(all[0].id);
  }, []);

  useEffect(() => {
    if (!selectedTemplateId) { setTemplate(null); setResponses({}); return; }
    const t = templates.find((t) => t.id === selectedTemplateId);
    if (!t) return;
    setTemplate(t);
    const saved = getResponses(auditId);
    setResponses(saved);
  }, [selectedTemplateId, templates, auditId]);

  const totalQuestions = template?.sections.reduce((a, s) => a + s.questions.length, 0) ?? 0;
  const answeredCount = Object.values(responses).filter((r) => r.result !== null).length;
  const score = template ? scoreAudit(template, responses) : 0;

  const updateResponse = useCallback((qId: string, patch: Partial<QuestionResponse>) => {
    setResponses((prev) => {
      const current = prev[qId] || emptyResponse(qId);
      const updated = { ...current, ...patch };
      saveResponse(auditId, qId, updated);
      return { ...prev, [qId]: updated };
    });
  }, [auditId]);

  const setResult = (qId: string, result: QuestionResult) => {
    const current = responses[qId] || emptyResponse(qId);
    const newResult = current.result === result ? null : result;
    updateResponse(qId, { result: newResult });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activePhotoQ) return;
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setResponses((prev) => {
          const current = prev[activePhotoQ] || emptyResponse(activePhotoQ);
          const updated = { ...current, photoDataUrls: [...current.photoDataUrls, dataUrl] };
          saveResponse(auditId, activePhotoQ, updated);
          return { ...prev, [activePhotoQ]: updated };
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    setActivePhotoQ(null);
  };

  const removePhoto = (qId: string, idx: number) => {
    const current = responses[qId] || emptyResponse(qId);
    const updated = current.photoDataUrls.filter((_, i) => i !== idx);
    updateResponse(qId, { photoDataUrls: updated });
  };

  const handleSubmit = async () => {
    if (!template) return;
    const unanswered = template.sections.flatMap((s) =>
      s.questions.filter((q) => {
        const r = responses[q.id];
        return !r || r.result === null;
      })
    );
    if (unanswered.length > 0) {
      toast.error(`${unanswered.length} question${unanswered.length > 1 ? 's' : ''} still unanswered`);
      return;
    }
    setSubmitting(true);
    try {
      await fetch(`/api/v1/audits/${auditId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUBMITTED', complianceScore: score }),
      });
      setSubmitted(true);
      toast.success(`Audit submitted — Score: ${score}%`);
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-5 pt-20">
        <div className={cn('text-6xl font-black', scoreColor(score))}>{score}%</div>
        <CheckCircle2 size={56} className="mx-auto text-green-500" />
        <h2 className="text-xl font-bold text-gray-900">Audit Submitted!</h2>
        <p className="text-sm text-gray-500">{answeredCount} questions answered · Template: {template?.name}</p>
        <div className="flex gap-3 justify-center pt-2">
          <Link href={`/dashboard/audits/${auditId}`} className="btn-secondary text-sm">View Audit</Link>
          <Link href="/dashboard/audits" className="btn-primary text-sm">All Audits</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <Link href={`/dashboard/audits/${auditId}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
            <ArrowLeft size={17} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 truncate">Conducting Audit</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{template?.name ?? 'Select a template below'}</p>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs text-gray-400">{answeredCount}/{totalQuestions} answered</p>
              {template && <p className={cn('text-sm font-bold', scoreColor(score))}>{score}%</p>}
            </div>
            {template && (
              <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', scoreBarColor(score))} style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
              </div>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !template || answeredCount === 0}
            className="btn-primary flex items-center gap-2 text-sm flex-shrink-0 disabled:opacity-50"
          >
            {submitting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
            Submit
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Template selector */}
        {templates.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">Audit Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="input w-full text-sm"
            >
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {!template && (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
            <p className="text-sm text-gray-400">No active templates found. <Link href="/dashboard/audit-templates" className="text-brand-600 hover:underline">Create one first.</Link></p>
          </div>
        )}

        {/* Sections */}
        {template?.sections.map((section) => {
          const isOpen = collapsedSections[section.id] !== true;
          const sectionAnswered = section.questions.filter((q) => responses[q.id]?.result !== null && responses[q.id]?.result !== undefined).length;
          return (
            <div key={section.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Section header */}
              <button
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/60 transition-colors"
                onClick={() => setCollapsedSections((p) => ({ ...p, [section.id]: isOpen }))}
              >
                {isOpen ? <ChevronDown size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronUp size={15} className="text-gray-400 flex-shrink-0" />}
                <span className="flex-1 font-semibold text-sm text-gray-800">{section.title}</span>
                <span className={cn('text-xs font-medium', sectionAnswered === section.questions.length ? 'text-green-600' : 'text-gray-400')}>
                  {sectionAnswered}/{section.questions.length}
                </span>
              </button>

              {isOpen && (
                <div className="divide-y divide-gray-50">
                  {section.questions.map((question, qi) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      response={responses[question.id] || emptyResponse(question.id)}
                      index={qi + 1}
                      onSetResult={(r) => setResult(question.id, r)}
                      onNotesChange={(notes) => updateResponse(question.id, { notes })}
                      onAddPhoto={() => { setActivePhotoQ(question.id); photoInputRef.current?.click(); }}
                      onRemovePhoto={(i) => removePhoto(question.id, i)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit footer */}
        {template && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">{answeredCount} of {totalQuestions} questions answered</p>
              {template && <p className={cn('text-xs font-medium mt-0.5', scoreColor(score))}>Current score: {score}%</p>}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || answeredCount === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
              Submit Audit
            </button>
          </div>
        )}
      </div>

      {/* Hidden photo input */}
      <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
    </div>
  );
}

/* ───────── QuestionCard ───────── */
interface QuestionCardProps {
  question: TemplateQuestion;
  response: QuestionResponse;
  index: number;
  onSetResult: (r: QuestionResult) => void;
  onNotesChange: (notes: string) => void;
  onAddPhoto: () => void;
  onRemovePhoto: (idx: number) => void;
}

function QuestionCard({ question, response, index, onSetResult, onNotesChange, onAddPhoto, onRemovePhoto }: QuestionCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const risk = RISK_CONFIG[question.riskLevel];
  const answered = response.result !== null;

  const isYes = response.result === 'YES';
  const isNo = response.result === 'NO';
  const isNa = response.result === 'NA';

  return (
    <div className={cn('px-5 py-4 transition-colors', answered ? 'bg-white' : 'bg-white hover:bg-gray-50/40')}>
      {/* Question header */}
      <div className="flex items-start gap-3 mb-3">
        <span className={cn('flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5',
          answered ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'
        )}>{index}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-relaxed">{question.text}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn('inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border font-medium', risk.cls)}>
              <AlertTriangle size={10} />{risk.label}
            </span>
            {question.requiresPhoto && <span className="text-xs text-gray-400 flex items-center gap-1"><Camera size={10} />Photo required</span>}
            {question.requiresNotes && <span className="text-xs text-gray-400 flex items-center gap-1"><StickyNote size={10} />Notes required</span>}
          </div>
        </div>
      </div>

      {/* YES / NO / N/A */}
      <div className="flex gap-2 ml-9 mb-3 flex-wrap">
        <AnswerButton
          label="Yes"
          icon={<CheckCircle2 size={15} />}
          active={isYes}
          activeClass="bg-green-500 text-white border-green-500 shadow-sm shadow-green-100"
          inactiveClass="border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600"
          onClick={() => onSetResult('YES')}
        />
        <AnswerButton
          label="No"
          icon={<XCircle size={15} />}
          active={isNo}
          activeClass="bg-red-500 text-white border-red-500 shadow-sm shadow-red-100"
          inactiveClass="border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600"
          onClick={() => onSetResult('NO')}
        />
        <AnswerButton
          label="N/A"
          icon={<MinusCircle size={15} />}
          active={isNa}
          activeClass="bg-gray-400 text-white border-gray-400"
          inactiveClass="border-gray-200 text-gray-400 hover:border-gray-400"
          onClick={() => onSetResult('NA')}
        />

        {/* Notes + Photo toggles */}
        <button
          onClick={() => setShowNotes((p) => !p)}
          className={cn('ml-auto flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
            showNotes || response.notes ? 'bg-purple-50 text-purple-600 border-purple-200' : 'border-gray-200 text-gray-400 hover:border-purple-200 hover:text-purple-500'
          )}
        >
          <StickyNote size={12} />
          {response.notes ? 'Notes ✓' : 'Notes'}
        </button>
        <button
          onClick={onAddPhoto}
          className={cn('flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
            response.photoDataUrls.length > 0 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-gray-200 text-gray-400 hover:border-blue-200 hover:text-blue-500'
          )}
        >
          <Camera size={12} />
          {response.photoDataUrls.length > 0 ? `${response.photoDataUrls.length} Photo${response.photoDataUrls.length > 1 ? 's' : ''}` : 'Photo'}
        </button>
      </div>

      {/* Notes textarea */}
      {(showNotes || response.notes || question.requiresNotes) && (
        <div className="ml-9 mb-3">
          <textarea
            value={response.notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add notes…"
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus:border-brand-400 transition-colors placeholder:text-gray-300"
          />
        </div>
      )}

      {/* Photo thumbnails */}
      {response.photoDataUrls.length > 0 && (
        <div className="ml-9 flex gap-2 flex-wrap">
          {response.photoDataUrls.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt={`Photo ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
              <button
                onClick={() => onRemovePhoto(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AnswerButtonProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  activeClass: string;
  inactiveClass: string;
  onClick: () => void;
}

function AnswerButton({ label, icon, active, activeClass, inactiveClass, onClick }: AnswerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
        active ? activeClass : inactiveClass,
      )}
    >
      {icon}{label}
    </button>
  );
}
