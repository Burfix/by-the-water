'use client';

import { useState, useRef, useCallback } from 'react';
import {
  X, Upload, Download, AlertCircle, CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Role } from '@/types';
import { importUsers } from '@/lib/userStore';
import { cn } from '@/lib/utils';

// ── Role mapping – accepts many human-readable variants ──────────────────────
const ROLE_MAP: Record<string, Role> = {
  'store': Role.STORE,
  'store manager': Role.STORE,
  'storemanager': Role.STORE,
  'sm': Role.STORE,
  'coordinator': Role.PROPERTY_COORDINATOR,
  'property coordinator': Role.PROPERTY_COORDINATOR,
  'propertycoordinator': Role.PROPERTY_COORDINATOR,
  'prop coordinator': Role.PROPERTY_COORDINATOR,
  'pc': Role.PROPERTY_COORDINATOR,
  'property_coordinator': Role.PROPERTY_COORDINATOR,
  'ops manager': Role.OPS_MANAGER,
  'opsmanager': Role.OPS_MANAGER,
  'operations manager': Role.OPS_MANAGER,
  'ops_manager': Role.OPS_MANAGER,
  'ops': Role.OPS_MANAGER,
  'executive': Role.EXEC,
  'exec': Role.EXEC,
  // accept exact enum values too
  'store_manager': Role.STORE,
};
// also accept raw enum strings
[Role.STORE, Role.PROPERTY_COORDINATOR, Role.OPS_MANAGER, Role.EXEC].forEach(
  (r) => { ROLE_MAP[r.toLowerCase()] = r; },
);

export const ROLE_LABELS: Record<Role, string> = {
  [Role.STORE]: 'Store Manager',
  [Role.PROPERTY_COORDINATOR]: 'Property Coordinator',
  [Role.OPS_MANAGER]: 'Ops Manager',
  [Role.EXEC]: 'Executive',
};

// ── Row type after parsing ────────────────────────────────────────────────────
interface ParsedRow {
  rowIndex: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role | null;
  rawRole: string;
  phone?: string;
  errors: string[];
}

function normaliseKey(k: string) {
  return k.toLowerCase().trim().replace(/[\s_-]+/g, '');
}

function parseRow(raw: Record<string, unknown>, idx: number): ParsedRow {
  const n: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    n[normaliseKey(k)] = String(v ?? '').trim();
  }

  // Name resolution ─ support both split and combined columns
  let firstName = n['firstname'] || n['first'] || '';
  let lastName  = n['lastname']  || n['last']  || '';
  if (!firstName && !lastName) {
    const full = n['name'] || n['fullname'] || '';
    const parts = full.split(/\s+/);
    firstName = parts[0] ?? '';
    lastName  = parts.slice(1).join(' ');
  }

  const email   = n['email'] || n['emailaddress'] || n['mail'] || '';
  const rawRole = n['role']  || n['userrole'] || n['access'] || n['position'] || '';
  const phone   = n['phone'] || n['mobile'] || n['cell'] || n['phonenumber'] || '';

  const errors: string[] = [];
  if (!firstName) errors.push('Missing first name');
  if (!email)     errors.push('Missing email');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email');

  const key = rawRole.toLowerCase().replace(/_/g, ' ');
  const mappedRole = ROLE_MAP[key] ?? ROLE_MAP[rawRole.toLowerCase()];
  if (!rawRole)     errors.push('Missing role');
  else if (!mappedRole) errors.push(`Unknown role "${rawRole}"`);

  return {
    rowIndex: idx + 2,
    firstName, lastName, email,
    role: mappedRole ?? null, rawRole,
    phone: phone || undefined,
    errors,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export function ImportUsersModal({ onClose, onSuccess }: Props) {
  const [rows, setRows]         = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isDragging, setDrag]   = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const buf  = await file.arrayBuffer();
    const XLSX = await import('xlsx');
    const wb   = XLSX.read(buf, { type: 'array' });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[];
    if (data.length === 0) { toast.error('The file appears to be empty'); return; }
    setRows(data.map((r, i) => parseRow(r, i)));
  }, []);

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(xlsx?|csv)$/i)) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }
    parseFile(file);
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([
      ['First Name', 'Last Name', 'Email', 'Role', 'Phone (Optional)'],
      ['John',  'Doe',      'john.doe@example.com',  'Store Manager', '+27 82 123 4567'],
      ['Jane',  'Smith',    'jane.smith@example.com','Coordinator',   '+27 83 987 6543'],
      ['Mike',  'Johnson',  'mike.j@example.com',    'Ops Manager',   ''],
      ['Sarah', 'Williams', 'sarah.w@example.com',   'Executive',     ''],
    ]);
    ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 32 }, { wch: 22 }, { wch: 22 }];

    const rolesWs = XLSX.utils.aoa_to_sheet([
      ['Valid Role Values (use exactly as shown)'],
      ['Store Manager'],
      ['Coordinator'],
      ['Ops Manager'],
      ['Executive'],
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.utils.book_append_sheet(wb, rolesWs, 'Valid Roles');
    XLSX.writeFile(wb, 'user-import-template.xlsx');
  };

  const validRows = rows.filter((r) => r.errors.length === 0);
  const errorRows = rows.filter((r) => r.errors.length > 0);

  const handleImport = async () => {
    setImporting(true);
    try {
      const { imported, skipped } = importUsers(
        validRows.map((r) => ({
          firstName: r.firstName,
          lastName:  r.lastName,
          email:     r.email,
          role:      r.role!,
          phone:     r.phone,
        })),
      );
      const parts = [`${imported} user${imported !== 1 ? 's' : ''} imported`];
      if (skipped > 0) parts.push(`${skipped} skipped (duplicate email)`);
      toast.success(parts.join(', '));
      onSuccess(imported);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Import Users from Excel</h2>
            <p className="text-xs text-gray-400 mt-0.5">.xlsx · .xls · .csv accepted</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              <Download size={14} /> Download Template
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {rows.length === 0 ? (
            /* Drop zone */
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-colors',
                isDragging
                  ? 'border-brand-400 bg-brand-50/40'
                  : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50/60',
              )}
            >
              <FileSpreadsheet size={44} className="mx-auto text-gray-300 mb-4" />
              <p className="text-sm font-medium text-gray-700">
                Drag & drop your file here, or <span className="text-brand-600">click to browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">.xlsx · .xls · .csv</p>
              <div className="mt-5 inline-block rounded-xl bg-gray-50 border border-gray-100 px-5 py-3 text-left text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-600 mb-1.5">Required columns</p>
                <p>• <span className="font-medium">First Name</span> &amp; <span className="font-medium">Last Name</span> (or a single <span className="font-medium">Name</span> column)</p>
                <p>• <span className="font-medium">Email</span></p>
                <p>• <span className="font-medium">Role</span> — Store Manager · Coordinator · Ops Manager · Executive</p>
              </div>
            </div>
          ) : (
            /* Preview */
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm font-semibold text-gray-700">{fileName}</p>
                  <span className="text-xs text-gray-400">{rows.length} rows</span>
                  {validRows.length > 0 && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle size={12} /> {validRows.length} valid
                    </span>
                  )}
                  {errorRows.length > 0 && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errorRows.length} with errors (will be skipped)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setRows([]); setFileName(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Change file
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {['Row', 'First Name', 'Last Name', 'Email', 'Role', 'Phone', 'Status'].map((h) => (
                          <th key={h} className="text-left py-2.5 px-3 text-xs text-gray-500 font-medium whitespace-nowrap border-b border-gray-200">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.map((r) => (
                        <tr key={r.rowIndex} className={r.errors.length > 0 ? 'bg-red-50/60' : 'bg-white hover:bg-gray-50'}>
                          <td className="py-2 px-3 text-xs text-gray-400">{r.rowIndex}</td>
                          <td className="py-2 px-3 font-medium text-gray-800">
                            {r.firstName || <span className="text-red-400 italic text-xs">missing</span>}
                          </td>
                          <td className="py-2 px-3 text-gray-600">{r.lastName || <span className="text-gray-300">—</span>}</td>
                          <td className="py-2 px-3 text-gray-600 text-xs">
                            {r.email || <span className="text-red-400 italic">missing</span>}
                          </td>
                          <td className="py-2 px-3">
                            {r.role ? (
                              <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                                {ROLE_LABELS[r.role]}
                              </span>
                            ) : (
                              <span className="text-xs text-red-500 italic">{r.rawRole || 'missing'}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-500">{r.phone || '—'}</td>
                          <td className="py-2 px-3">
                            {r.errors.length === 0 ? (
                              <CheckCircle size={14} className="text-green-500" />
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-red-500" title={r.errors.join('; ')}>
                                <AlertCircle size={13} /> {r.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {errorRows.length > 0 && (
                <p className="text-xs text-gray-400">
                  Fix the errors and re-upload the file to include the skipped rows.
                </p>
              )}
            </>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-100 flex-shrink-0 flex-wrap gap-3">
          <p className="text-sm text-gray-400">
            {validRows.length > 0
              ? `${validRows.length} user${validRows.length !== 1 ? 's' : ''} ready to import`
              : rows.length > 0
              ? 'No valid rows — fix errors and re-upload'
              : 'Upload a file to get started'}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary" disabled={importing}>Cancel</button>
            <button
              onClick={handleImport}
              disabled={validRows.length === 0 || importing}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing…</>
              ) : (
                <><Upload size={14} /> Import{validRows.length > 0 ? ` ${validRows.length}` : ''} Users</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
