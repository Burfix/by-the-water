import { NextResponse } from 'next/server';

const MOCK_AUDIT = {
  id: 'a1',
  storeId: 's1',
  store: { id: 's1', name: 'Waterfront Flagship', storeCode: 'WF001', isActive: true, precinctId: 'p1', complianceScore: 94, createdAt: '2025-01-01' },
  auditor: { id: '3', firstName: 'Property', lastName: 'Coordinator', email: 'coordinator@compliance.local', role: 'PROPERTY_COORDINATOR', isActive: true },
  status: 'SUBMITTED',
  scheduledDate: '2026-02-20',
  complianceScore: 87.5,
  auditType: 'Health & Safety',
  rejectionReason: null,
  items: [
    { id: 'i1', category: 'Health & Safety', question: 'Fire extinguishers present and in date?', result: 'PASS', weight: 8, notes: 'All 4 extinguishers checked', sortOrder: 1 },
    { id: 'i2', category: 'Health & Safety', question: 'Emergency exits clearly marked?', result: 'PASS', weight: 7, notes: null, sortOrder: 2 },
    { id: 'i3', category: 'Food Standards', question: 'Temperature logs up to date?', result: 'FAIL', weight: 9, notes: 'Logs missing for 3 days', sortOrder: 3 },
    { id: 'i4', category: 'Food Standards', question: 'Expiry dates checked on all products?', result: 'PASS', weight: 8, notes: null, sortOrder: 4 },
    { id: 'i5', category: 'General', question: 'Staff uniforms compliant?', result: 'NOT_APPLICABLE', weight: 3, notes: null, sortOrder: 5 },
    { id: 'i6', category: 'General', question: 'Store signage up to date?', result: 'PASS', weight: 5, notes: null, sortOrder: 6 },
  ],
  photos: [],
  createdAt: '2026-02-18T09:00:00Z',
  updatedAt: '2026-02-20T14:30:00Z',
};

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: { ...MOCK_AUDIT, id: params.id },
  });
}
