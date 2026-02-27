import { NextResponse } from 'next/server';

const MOCK_STORES = Array.from({ length: 24 }, (_, i) => {
  const precincts = [
    { id: 'p1', name: 'Cape Town CBD', region: 'Western Cape' },
    { id: 'p2', name: 'Sandton North', region: 'Gauteng' },
    { id: 'p3', name: 'Durban Waterfront', region: 'KwaZulu-Natal' },
    { id: 'p4', name: 'Pretoria East', region: 'Gauteng' },
  ];
  const cities = ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'];
  const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE'];
  return {
    id: `s${i + 1}`,
    storeCode: `ST-${String(1001 + i).padStart(4, '0')}`,
    name: `Store ${i + 1} - ${['Waterfront', 'Central', 'Mall', 'Plaza', 'Park', 'Village'][i % 6]}`,
    address: `${10 + i * 3} Main Road, ${cities[i % cities.length]}`,
    city: cities[i % cities.length],
    phone: `+27 21 ${String(500 + i * 7).padStart(3, '0')} 0000`,
    email: `store${i + 1}@compliance.local`,
    status: statuses[i % statuses.length],
    complianceScore: Math.round(55 + Math.random() * 45),
    precinct: precincts[i % 4],
    createdAt: '2024-01-15',
  };
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const store = MOCK_STORES.find((s) => s.id === params.id) ?? MOCK_STORES[0];
  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data: store });
}
