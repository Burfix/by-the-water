import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      id: 's1',
      name: 'Waterfront Flagship',
      storeCode: 'WF001',
      city: 'Cape Town',
      address: '1 Harbour Rd, V&A Waterfront',
      precinctId: 'p1',
      precinct: { id: 'p1', name: 'V&A Waterfront', region: 'Western Cape', isActive: true, createdAt: '2025-01-01' },
      complianceScore: 94.2,
      isActive: true,
      createdAt: '2025-01-01',
    },
  });
}
