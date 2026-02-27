import { AuditTemplate, TemplateSection, TemplateQuestion, RiskLevel } from '@/types';

const KEY = 'btw_audit_templates';
const RESPONSES_KEY = 'btw_audit_responses';
const isBrowser = () => typeof window !== 'undefined';

// ── helpers ───────────────────────────────────────────────────────────────────
function uid() { return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function qid() { return `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function sid() { return `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

function makeQ(text: string, risk: RiskLevel, requiresPhoto = false, requiresNotes = false, weight = 5, sortOrder = 0): TemplateQuestion {
  return { id: qid(), text, riskLevel: risk, requiresPhoto, requiresNotes, weight, sortOrder };
}

// ── Pre-built BOH Food & Beverage Health & Safety template (from actual audit) ─
export const BOH_TEMPLATE: AuditTemplate = {
  id: 'tpl_boh_fnb_001',
  name: 'Food & Beverage Checklist – Health & Safety',
  description: 'Back of house health and safety compliance audit for food & beverage outlets.',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  sections: [
    {
      id: 's_gc_001', title: 'General Condition of Premises', sortOrder: 0,
      questions: [
        makeQ('Are the floors clear of any obstructions?', 'MEDIUM', false, false, 5, 0),
        makeQ('Are all tiles and carpets properly secured?', 'MEDIUM', true, false, 5, 1),
        makeQ('All furniture and equipment in good working order?', 'MEDIUM', true, true, 6, 2),
        makeQ('All doors, hinges and fittings in good order?', 'MEDIUM', true, true, 5, 3),
        makeQ('Is stacking and storage done in a manner to prevent hazards and meeting the safety standards?', 'HIGH', true, true, 7, 4),
      ],
    },
    {
      id: 's_fire_001', title: 'Fire, Emergency & Safety Management', sortOrder: 1,
      questions: [
        makeQ('Fire extinguishers, safety blankets are available, wall mounted, serviced and accessible?', 'CRITICAL', true, true, 10, 0),
        makeQ('Fully stocked first aid kit is available and accessible to all employees. Competent first aider appointed?', 'HIGH', true, true, 9, 1),
        makeQ('Photoluminescent fire safety signs available and compliant with SABS legislation?', 'HIGH', true, true, 8, 2),
        makeQ('Fire door is still in good condition and not tampered with?', 'CRITICAL', true, true, 10, 3),
        makeQ('Are heat detectors provided and clean?', 'HIGH', true, false, 8, 4),
        makeQ('Are sprinkler heads provided and clean?', 'HIGH', true, false, 8, 5),
        makeQ('Are smoke detectors provided and clean?', 'HIGH', true, false, 8, 6),
        makeQ('Are up to date canopy extraction certificates submitted to management on a quarterly basis? Certificate must be displayed.', 'HIGH', false, true, 7, 7),
        makeQ('Is a canopy extraction service undertaken by a professional cleaning company?', 'HIGH', false, true, 7, 8),
        makeQ('Is the suppression system serviced, labelled clearly with dates?', 'CRITICAL', false, true, 10, 9),
        makeQ('Is the ecology unit serviced, certificate available?', 'MEDIUM', false, true, 5, 10),
      ],
    },
    {
      id: 's_elec_001', title: 'Electrical', sortOrder: 2,
      questions: [
        makeQ('Are all light fittings and switches in good working order?', 'MEDIUM', true, false, 5, 0),
        makeQ('Are light bulbs / tubes in good working order?', 'LOW', true, false, 3, 1),
        makeQ('Is the electrical distribution board accessible, well maintained and compliant according to council regulation?', 'HIGH', true, true, 8, 2),
        makeQ('Is there any exposed electrical wiring?', 'CRITICAL', true, true, 10, 3),
        makeQ('Is there sufficient light (natural or artificial)?', 'MEDIUM', true, false, 5, 4),
        makeQ('Is there overloading of plug walls (not more than 4 items plugged in)?', 'HIGH', true, false, 7, 5),
        makeQ('Are all wall plugs safe to use?', 'HIGH', true, false, 7, 6),
        makeQ('Are power cords neatly channeled away from any water and/or heat?', 'HIGH', true, false, 7, 7),
        makeQ('Is the walk-in fridge/freezer fitted with an emergency release mechanism on the inside of the door?', 'CRITICAL', true, false, 10, 8),
      ],
    },
    {
      id: 's_gas_001', title: 'Gas', sortOrder: 3,
      questions: [
        makeQ('No gas bottles allowed on site unless approved by management?', 'CRITICAL', true, true, 10, 0),
        makeQ('Gas leak detection and shutoff valve in place and serviced – certificate is available?', 'CRITICAL', false, true, 10, 1),
        makeQ('Is a bump rail fitted behind cooking equipment to safeguard the gas installation?', 'HIGH', true, false, 8, 2),
        makeQ('Is the gas shut off valve signage in place?', 'HIGH', true, false, 7, 3),
      ],
    },
    {
      id: 's_comments_001', title: 'General Comments', sortOrder: 4,
      questions: [
        makeQ('General comments? If none, type N/A.', 'LOW', false, true, 1, 0),
      ],
    },
  ],
};

// ── CRUD ──────────────────────────────────────────────────────────────────────
export function getTemplates(): AuditTemplate[] {
  if (!isBrowser()) return [BOH_TEMPLATE];
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) {
      // Seed with the BOH template on first load
      localStorage.setItem(KEY, JSON.stringify([BOH_TEMPLATE]));
      return [BOH_TEMPLATE];
    }
    return JSON.parse(stored) as AuditTemplate[];
  } catch { return [BOH_TEMPLATE]; }
}

function persist(templates: AuditTemplate[]) {
  if (isBrowser()) localStorage.setItem(KEY, JSON.stringify(templates));
}

export function getTemplateById(id: string): AuditTemplate | undefined {
  return getTemplates().find((t) => t.id === id);
}

export function saveTemplate(template: AuditTemplate) {
  const all = getTemplates();
  const idx = all.findIndex((t) => t.id === template.id);
  const updated = { ...template, updatedAt: new Date().toISOString() };
  if (idx >= 0) { all[idx] = updated; persist(all); }
  else { persist([...all, updated]); }
  return updated;
}

export function createTemplate(name: string, description?: string): AuditTemplate {
  const tpl: AuditTemplate = {
    id: uid(),
    name,
    description,
    sections: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  persist([...getTemplates(), tpl]);
  return tpl;
}

export function deleteTemplate(id: string) {
  persist(getTemplates().filter((t) => t.id !== id));
}

export function duplicateTemplate(id: string): AuditTemplate | null {
  const original = getTemplateById(id);
  if (!original) return null;
  const copy: AuditTemplate = {
    ...JSON.parse(JSON.stringify(original)),
    id: uid(),
    name: `${original.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  persist([...getTemplates(), copy]);
  return copy;
}

// ── Section / Question helpers ────────────────────────────────────────────────
export function makeNewSection(sortOrder: number): TemplateSection {
  return { id: sid(), title: 'New Section', questions: [], sortOrder };
}

export function makeNewQuestion(sortOrder: number): TemplateQuestion {
  return { id: qid(), text: '', riskLevel: 'MEDIUM', requiresPhoto: false, requiresNotes: false, weight: 5, sortOrder };
}

// ── Audit responses ───────────────────────────────────────────────────────────
export function getResponses(auditId: string) {
  if (!isBrowser()) return {};
  try {
    const all = JSON.parse(localStorage.getItem(RESPONSES_KEY) ?? '{}');
    return all[auditId] ?? {};
  } catch { return {}; }
}

export function saveResponse(auditId: string, questionId: string, response: import('@/types').QuestionResponse) {
  if (!isBrowser()) return;
  try {
    const all = JSON.parse(localStorage.getItem(RESPONSES_KEY) ?? '{}');
    if (!all[auditId]) all[auditId] = {};
    all[auditId][questionId] = response;
    localStorage.setItem(RESPONSES_KEY, JSON.stringify(all));
  } catch {}
}

export function clearResponses(auditId: string) {
  if (!isBrowser()) return;
  try {
    const all = JSON.parse(localStorage.getItem(RESPONSES_KEY) ?? '{}');
    delete all[auditId];
    localStorage.setItem(RESPONSES_KEY, JSON.stringify(all));
  } catch {}
}

export function scoreAudit(template: AuditTemplate, responses: Record<string, import('@/types').QuestionResponse>): number {
  let totalWeight = 0;
  let earnedWeight = 0;
  template.sections.forEach((s) => {
    s.questions.forEach((q) => {
      const r = responses[q.id];
      if (!r || r.result === 'NA') return;
      totalWeight += q.weight;
      if (r.result === 'YES') earnedWeight += q.weight;
    });
  });
  return totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100);
}
