import { NextResponse } from 'next/server';

// Mock JWT – base64(header).base64(payload).base64(signature)
// payload: { sub: "1", email, role, firstName, lastName, exp: far future }
function makeToken(user: Record<string, unknown>, expiresInDays = 1) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ sub: user.id, ...user, iat: now, exp: now + expiresInDays * 86400 }),
  ).toString('base64url');
  return `${header}.${payload}.mock_signature`;
}

const MOCK_USERS: Record<string, { id: string; email: string; password: string; firstName: string; lastName: string; role: string; isActive: boolean }> = {
  'admin@compliance.local': {
    id: '1',
    email: 'admin@compliance.local',
    password: 'Admin@1234!',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'OPS_MANAGER',
    isActive: true,
  },
  'exec@compliance.local': {
    id: '2',
    email: 'exec@compliance.local',
    password: 'Admin@1234!',
    firstName: 'Executive',
    lastName: 'User',
    role: 'EXEC',
    isActive: true,
  },
  'coordinator@compliance.local': {
    id: '3',
    email: 'coordinator@compliance.local',
    password: 'Admin@1234!',
    firstName: 'Property',
    lastName: 'Coordinator',
    role: 'PROPERTY_COORDINATOR',
    isActive: true,
  },
  'store@compliance.local': {
    id: '4',
    email: 'store@compliance.local',
    password: 'Admin@1234!',
    firstName: 'Store',
    lastName: 'Manager',
    role: 'STORE',
    isActive: true,
  },
};

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  const user = MOCK_USERS[email?.toLowerCase()];

  if (!user || user.password !== password) {
    return NextResponse.json(
      { success: false, message: 'Invalid email or password', data: null, timestamp: new Date().toISOString() },
      { status: 401 },
    );
  }

  const { password: _pw, ...safeUser } = user;
  const accessToken = makeToken({ ...safeUser }, 1);
  const refreshToken = makeToken({ ...safeUser }, 7);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      user: safeUser,
    },
  });
}
