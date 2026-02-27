import { NextResponse } from 'next/server';

const MOCK_USERS = Array.from({ length: 10 }, (_, i) => ({
  id: `u${i + 1}`,
  email: `user${i + 1}@compliance.local`,
  firstName: ['System', 'Executive', 'Jane', 'Bob', 'Alice', 'Mike', 'Sarah', 'David', 'Lisa', 'Tom'][i],
  lastName: ['Administrator', 'Director', 'Smith', 'Jones', 'Brown', 'Wilson', 'Davis', 'Miller', 'Anderson', 'Taylor'][i],
  role: ['OPS_MANAGER', 'EXEC', 'PROPERTY_COORDINATOR', 'PROPERTY_COORDINATOR', 'PROPERTY_COORDINATOR', 'STORE', 'STORE', 'STORE', 'STORE', 'STORE'][i],
  isActive: i !== 8,
  phone: `+27 82 ${String(100 + i * 11).padStart(3, '0')} 0000`,
  lastLoginAt: i < 5 ? new Date(Date.now() - i * 86400000).toISOString() : null,
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
    data: { data: MOCK_USERS.slice(start, start + limit), total: MOCK_USERS.length, page, limit },
  });
}
