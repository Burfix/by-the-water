import { NextResponse } from 'next/server';
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data: { id: params.id, status: 'REJECTED', rejectionReason: body.reason ?? 'Rejected' } });
}
