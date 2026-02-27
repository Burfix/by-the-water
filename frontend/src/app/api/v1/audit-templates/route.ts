import { NextResponse } from 'next/server';
import { BOH_TEMPLATE } from '@/lib/templateStore';

export async function GET() {
  return NextResponse.json({ success: true, data: { data: [BOH_TEMPLATE], total: 1, page: 1, limit: 50 } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ success: true, data: { ...body, id: `tpl_${Date.now()}`, createdAt: new Date().toISOString() } }, { status: 201 });
}
