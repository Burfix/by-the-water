import { NextResponse } from 'next/server';

const MOCK_PRECINCTS = [
  { id: 'p1', name: 'Cape Town CBD', region: 'Western Cape', storeCount: 8, createdAt: '2024-01-10', updatedAt: '2025-01-01' },
  { id: 'p2', name: 'Sandton North', region: 'Gauteng', storeCount: 6, createdAt: '2024-02-15', updatedAt: '2025-01-05' },
  { id: 'p3', name: 'Durban Waterfront', region: 'KwaZulu-Natal', storeCount: 5, createdAt: '2024-03-01', updatedAt: '2025-01-08' },
  { id: 'p4', name: 'Pretoria East', region: 'Gauteng', storeCount: 5, createdAt: '2024-04-20', updatedAt: '2025-01-10' },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = parseInt(url.searchParams.get('limit') ?? '15');
  const start = (page - 1) * limit;
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: { data: MOCK_PRECINCTS.slice(start, start + limit), total: MOCK_PRECINCTS.length, page, limit },
  });
}
