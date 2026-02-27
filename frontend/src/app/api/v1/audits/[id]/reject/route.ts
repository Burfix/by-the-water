import { NextResponse } from 'next/server';
import { auditStore, DEFAULT_AUDIT } from '@/lib/auditMockStore';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const existing = auditStore.get(params.id) ?? { ...DEFAULT_AUDIT, id: params.id };
  const updated = { ...existing, status: 'REJECTED', rejectionReason: body.reason ?? 'Rejected', updatedAt: new Date().toISOString() };
  auditStore.set(params.id, updated);
  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data: updated });
}
