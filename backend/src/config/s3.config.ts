import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  bucket: process.env.AWS_S3_BUCKET || 'compliance-audit-storage',
  endpoint: process.env.AWS_S3_ENDPOINT || undefined, // MinIO / Cloudflare R2
  signedUrlExpiresIn: 3600, // 1 hour
}));
