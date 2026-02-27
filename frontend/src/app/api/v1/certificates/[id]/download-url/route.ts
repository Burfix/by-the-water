import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      url: `https://mock-s3-bucket.s3.af-south-1.amazonaws.com/certificates/${params.id}.pdf?X-Amz-Expires=900`,
      expiresIn: 900,
    },
  });
}
