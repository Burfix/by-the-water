import { NextResponse } from 'next/server';

const MOCK_NOTIFICATIONS = Array.from({ length: 15 }, (_, i) => ({
  id: `n${i + 1}`,
  type: ['CERTIFICATE_EXPIRY_WARNING', 'AUDIT_SUBMITTED', 'AUDIT_APPROVED', 'CERTIFICATE_EXPIRY_CRITICAL', 'COMPLIANCE_SCORE_LOW'][i % 5],
  message: [
    'Health Certificate for Waterfront Flagship expires in 7 days',
    'Audit for V&A Quay has been submitted for review',
    'Audit for Clock Tower has been approved — Score: 94%',
    '⚠️ Fire Safety Certificate for East Pier Kiosk expires in 2 days',
    '🔴 Compliance score for North Jetty dropped below 60%',
  ][i % 5],
  isRead: i > 4,
  createdAt: new Date(Date.now() - i * 3600000 * 6).toISOString(),
}));

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = parseInt(url.searchParams.get('limit') ?? '20');
  const start = (page - 1) * limit;
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: { data: MOCK_NOTIFICATIONS.slice(start, start + limit), total: MOCK_NOTIFICATIONS.length, page, limit },
  });
}
