import { NextResponse } from 'next/server';

const MOCK_STORES = Array.from({ length: 24 }, (_, i) => ({
  id: `s${i + 1}`,
  name: ['Waterfront Flagship', 'V&A Quay', 'Clock Tower', 'Breakwater Lodge', 'Swing Bridge', 'Amphitheatre', 'Pierhead', 'Portswood', 'East Pier Kiosk', 'North Jetty', 'Harbour Edge', 'Dock Side', 'Marina Walk', 'Seapoint', 'Granger Bay', 'Foreshore', 'Cruise Terminal', 'Nobel Square', 'Mouille Point', 'Sea Point', 'Green Point', 'De Waterkant', 'Fresnaye', 'Bantry Bay'][i],
  storeCode: `STR${String(i + 1).padStart(3, '0')}`,
  city: 'Cape Town',
  address: `${i + 1} Harbour Rd, V&A Waterfront`,
  precinctId: `p${(i % 4) + 1}`,
  precinct: { id: `p${(i % 4) + 1}`, name: ['V&A Waterfront', 'Clock Tower', 'East Pier', 'Marina Precinct'][i % 4], region: 'Western Cape', isActive: true, createdAt: '2025-01-01' },
  complianceScore: Math.round(50 + Math.random() * 50),
  isActive: true,
  createdAt: '2025-01-01',
}));

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = parseInt(url.searchParams.get('limit') ?? '15');
  const start = (page - 1) * limit;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      data: MOCK_STORES.slice(start, start + limit),
      total: MOCK_STORES.length,
      page,
      limit,
    },
  });
}
