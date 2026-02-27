import { NextResponse } from 'next/server';

const CERT_TYPES = ['Health Certificate', 'Fire Safety Certificate', 'Food Handler Certificate', 'Liquor Licence', 'Building Compliance'];

const MOCK_CERTS = Array.from({ length: 20 }, (_, i) => {
  const daysUntil = -10 + i * 12;
  const expiry = new Date(Date.now() + daysUntil * 86400000).toISOString().split('T')[0];
  return {
    id: `c${i + 1}`,
    storeId: `s${(i % 8) + 1}`,
    store: { id: `s${(i % 8) + 1}`, name: ['Waterfront Flagship', 'V&A Quay', 'Clock Tower', 'Breakwater Lodge', 'Swing Bridge', 'East Pier Kiosk', 'North Jetty', 'Marina Walk'][i % 8], storeCode: `STR${String((i % 8) + 1).padStart(3, '0')}`, isActive: true, precinctId: 'p1', createdAt: '2025-01-01' },
    certificateType: CERT_TYPES[i % 5],
    issueDate: new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0],
    expiryDate: expiry,
    isExpired: daysUntil < 0,
    isExpiringSoon: daysUntil >= 0 && daysUntil <= 30,
    daysUntilExpiry: daysUntil,
    isActive: true,
    s3Key: null,
    createdAt: '2025-01-01',
  };
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = parseInt(url.searchParams.get('limit') ?? '15');
  const storeId = url.searchParams.get('storeId');

  const filtered = storeId ? MOCK_CERTS.filter((c) => c.storeId === storeId) : MOCK_CERTS;
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
  const body = await request.json();
  const newCert = {
    id: `c${Date.now()}`,
    storeId: body.storeId,
    store: {
      id: body.storeId,
      name: 'Waterfront Flagship',
      storeCode: 'WF001',
      isActive: true,
      precinctId: 'p1',
      createdAt: '2025-01-01',
    },
    certificateType: body.certificateType ?? 'Other',
    issueDate: body.issueDate ?? new Date().toISOString().split('T')[0],
    expiryDate: body.expiryDate ?? new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    isExpired: false,
    isExpiringSoon: false,
    daysUntilExpiry: 365,
    isActive: true,
    s3Key: body.s3Key ?? `mock/cert-${Date.now()}.pdf`,
    createdAt: new Date().toISOString().split('T')[0],
  };
  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data: newCert }, { status: 201 });
}
