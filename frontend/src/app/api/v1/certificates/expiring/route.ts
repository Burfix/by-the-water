import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days') ?? '30');

  const certs = Array.from({ length: 7 }, (_, i) => ({
    id: `exp${i + 1}`,
    storeId: `s${i + 1}`,
    store: { id: `s${i + 1}`, name: ['Waterfront Flagship', 'V&A Quay', 'Clock Tower', 'Breakwater', 'Swing Bridge', 'East Pier', 'North Jetty'][i], storeCode: `STR00${i + 1}`, isActive: true, precinctId: 'p1', createdAt: '2025-01-01' },
    certificateType: ['Health Certificate', 'Fire Safety', 'Food Handler Certificate', 'Liquor Licence', 'Building Compliance', 'Health Certificate', 'Fire Safety'][i],
    issueDate: '2025-02-25',
    expiryDate: new Date(Date.now() + (i + 1) * 4 * 86400000).toISOString().split('T')[0],
    isExpired: false,
    isExpiringSoon: true,
    daysUntilExpiry: (i + 1) * 4,
    isActive: true,
    createdAt: '2025-01-01',
  })).filter((c) => c.daysUntilExpiry <= days);

  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data: certs });
}
