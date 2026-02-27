import { NextResponse } from 'next/server';

const MOCK_METRICS = {
  totalStores: 24,
  totalAudits: 187,
  pendingAudits: 12,
  approvedAudits: 143,
  avgComplianceScore: 81.4,
  expiringCertificates: 7,
  expiredCertificates: 2,
  totalCoordinators: 6,
  auditsByStatus: [
    { status: 'APPROVED', count: 143 },
    { status: 'SUBMITTED', count: 18 },
    { status: 'IN_PROGRESS', count: 9 },
    { status: 'DRAFT', count: 12 },
    { status: 'REJECTED', count: 5 },
  ],
  topStores: [
    { id: 's1', name: 'Waterfront Flagship', storeCode: 'WF001', complianceScore: 97.2, isActive: true, precinctId: 'p1' },
    { id: 's2', name: 'V&A Quay', storeCode: 'VA002', complianceScore: 95.8, isActive: true, precinctId: 'p1' },
    { id: 's3', name: 'Clock Tower', storeCode: 'CT003', complianceScore: 94.1, isActive: true, precinctId: 'p1' },
    { id: 's4', name: 'Breakwater Lodge', storeCode: 'BW004', complianceScore: 92.6, isActive: true, precinctId: 'p2' },
    { id: 's5', name: 'Swing Bridge', storeCode: 'SB005', complianceScore: 91.3, isActive: true, precinctId: 'p2' },
  ],
  lowStores: [
    { id: 's20', name: 'East Pier Kiosk', storeCode: 'EP020', complianceScore: 54.1, isActive: true, precinctId: 'p3' },
    { id: 's21', name: 'North Jetty', storeCode: 'NJ021', complianceScore: 58.7, isActive: true, precinctId: 'p3' },
    { id: 's22', name: 'Harbour Edge', storeCode: 'HE022', complianceScore: 61.2, isActive: true, precinctId: 'p3' },
    { id: 's23', name: 'Dock Side', storeCode: 'DS023', complianceScore: 63.5, isActive: true, precinctId: 'p4' },
    { id: 's24', name: 'Marina Walk', storeCode: 'MW024', complianceScore: 65.9, isActive: true, precinctId: 'p4' },
  ],
  recentAudits: [
    { id: 'a1', status: 'APPROVED', scheduledDate: '2026-02-20', complianceScore: 94, store: { name: 'Waterfront Flagship', storeCode: 'WF001' }, auditor: { firstName: 'Jane', lastName: 'Smith' } },
    { id: 'a2', status: 'SUBMITTED', scheduledDate: '2026-02-22', complianceScore: 78, store: { name: 'V&A Quay', storeCode: 'VA002' }, auditor: { firstName: 'Bob', lastName: 'Jones' } },
    { id: 'a3', status: 'IN_PROGRESS', scheduledDate: '2026-02-24', complianceScore: null, store: { name: 'Clock Tower', storeCode: 'CT003' }, auditor: { firstName: 'Jane', lastName: 'Smith' } },
    { id: 'a4', status: 'REJECTED', scheduledDate: '2026-02-18', complianceScore: 55, store: { name: 'East Pier Kiosk', storeCode: 'EP020' }, auditor: { firstName: 'Bob', lastName: 'Jones' } },
    { id: 'a5', status: 'DRAFT', scheduledDate: '2026-02-26', complianceScore: null, store: { name: 'North Jetty', storeCode: 'NJ021' }, auditor: { firstName: 'Alice', lastName: 'Brown' } },
  ],
  complianceTrend: [
    { month: 'Sep', avgScore: 73.2, auditCount: 28 },
    { month: 'Oct', avgScore: 75.8, auditCount: 31 },
    { month: 'Nov', avgScore: 78.4, auditCount: 29 },
    { month: 'Dec', avgScore: 77.1, auditCount: 22 },
    { month: 'Jan', avgScore: 80.3, auditCount: 34 },
    { month: 'Feb', avgScore: 81.4, auditCount: 43 },
  ],
};

export async function GET() {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: MOCK_METRICS,
  });
}
