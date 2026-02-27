import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: [
      { precinctName: 'V&A Waterfront', storeCount: 8, avgScore: 88.4 },
      { precinctName: 'Clock Tower', storeCount: 5, avgScore: 82.1 },
      { precinctName: 'East Pier', storeCount: 6, avgScore: 65.3 },
      { precinctName: 'Marina Precinct', storeCount: 5, avgScore: 71.8 },
    ],
  });
}
