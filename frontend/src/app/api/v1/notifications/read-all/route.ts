import { NextResponse } from 'next/server';
export async function PATCH() {
  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data: null });
}
