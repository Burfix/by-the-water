import { NextResponse } from 'next/server';
import { auditStore, DEFAULT_AUDIT } from '@/lib/auditMockStore';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const audit = auditStore.get(params.id) ?? { ...DEFAULT_AUDIT, id: params.id };
  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data: audit });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const existing = auditStore.get(params.id) ?? { ...DEFAULT_AUDIT, id: params.id };
    const updated = { ...existing, ...body, id: params.id, updatedAt: new Date().toISOString() };
    auditStore.set(params.id, updated);
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data: updated });
  } catch {
    const existing = auditStore.get(params.id) ?? { ...DEFAULT_AUDIT, id: params.id };
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data: existing });
  }
}
