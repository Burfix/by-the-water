import { NextResponse } from 'next/server';

const STATUSES = ['DRAFT', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED'];
const STORE_NAMES = ['Waterfront Flagship', 'V&A Quay', 'Clock Tower', 'Breakwater Lodge', 'Swing Bridge', 'East Pier Kiosk', 'North Jetty', 'Marina Walk'];

const MOCK_AUDITS = Array.from({ length: 30 }, (_, i) => ({
  id: `a${i + 1}`,
  storeId: `s${(i % 8) + 1}`,
  store: { id: `s${(i % 8) + 1}`, name: STORE_NAMES[i % 8], storeCode: `STR${String((i % 8) + 1).padStart(3, '0')}`, isActive: true, precinctId: 'p1', complianceScore: 75, createdAt: '2025-01-01' },
  auditor: { id: '3', firstName: 'Property', lastName: 'Coordinator', email: 'coordinator@compliance.local', role: 'PROPERTY_COORDINATOR', isActive: true },
  status: STATUSES[i % 5],
  scheduledDate: new Date(Date.now() - (i * 3 + 1) * 86400000).toISOString().split('T')[0],
  complianceScore: STATUSES[i % 5] === 'APPROVED' || STATUSES[i % 5] === 'SUBMITTED' ? Math.round(55 + Math.random() * 45) : null,
  auditType: ['Health & Safety', 'Food Standards', 'Fire Safety', 'General Compliance'][i % 4],
  rejectionReason: STATUSES[i % 5] === 'REJECTED' ? 'Several critical items failed inspection. Please re-audit within 7 days.' : null,
  items: i === 0 ? [
    { id: 'i1', category: 'Health & Safety', question: 'Fire extinguishers present and in date?', result: 'PASS', weight: 8, notes: 'All 4 extinguishers checked', sortOrder: 1 },
    { id: 'i2', category: 'Health & Safety', question: 'Emergency exits clearly marked?', result: 'PASS', weight: 7, notes: null, sortOrder: 2 },
    { id: 'i3', category: 'Food Standards', question: 'Temperature logs up to date?', result: 'FAIL', weight: 9, notes: 'Logs missing for 3 days', sortOrder: 3 },
    { id: 'i4', category: 'Food Standards', question: 'Expiry dates checked on all products?', result: 'PASS', weight: 8, notes: null, sortOrder: 4 },
    { id: 'i5', category: 'General', question: 'Staff uniforms compliant?', result: 'NOT_APPLICABLE', weight: 3, notes: null, sortOrder: 5 },
  ] : [],
  photos: [],
  createdAt: new Date(Date.now() - (i * 3 + 2) * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = parseInt(url.searchParams.get('limit') ?? '15');
  const status = url.searchParams.get('status');
  const storeId = url.searchParams.get('storeId');

  let filtered = MOCK_AUDITS;
  if (status) filtered = filtered.filter((a) => a.status === status);
  if (storeId) filtered = filtered.filter((a) => a.storeId === storeId);

  const start = (page - 1) * limit;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      data: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newAudit = {
      ...MOCK_AUDITS[0],
      id: `a_new_${Date.now()}`,
      storeId: body.storeId ?? MOCK_AUDITS[0].storeId,
      store: MOCK_AUDITS.find((a) => a.storeId === body.storeId)?.store ?? MOCK_AUDITS[0].store,
      status: 'DRAFT',
      scheduledDate: body.scheduledDate ?? new Date().toISOString().split('T')[0],
      auditType: body.auditType ?? 'General',
      notes: body.notes ?? null,
      complianceScore: null,
      items: [],
      photos: [],
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data: newAudit });
  } catch {
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data: { ...MOCK_AUDITS[0], id: `a_new_${Date.now()}`, status: 'DRAFT' } });
  }
}
