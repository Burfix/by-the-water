import { NextResponse } from 'next/server';
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data: { id: params.id, isRead: true } });
}
