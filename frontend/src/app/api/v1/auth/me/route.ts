import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest) {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      id: '1',
      email: 'admin@compliance.local',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'OPS_MANAGER',
      isActive: true,
    },
  });
}
