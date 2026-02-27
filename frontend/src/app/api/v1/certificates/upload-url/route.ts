import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const fileName = (body.fileName as string) ?? 'certificate.pdf';
  const s3Key = `certificates/${body.storeId ?? 'store'}/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      uploadUrl: `https://mock-s3-bucket.s3.af-south-1.amazonaws.com/${s3Key}?X-Amz-Expires=300&mock=true`,
      s3Key,
      s3Bucket: 'compliance-certificates-mock',
    },
  });
}
