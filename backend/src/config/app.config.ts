import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  // Railway injects PORT dynamically; BACKEND_PORT is our local override; 3001 is fallback
  port: parseInt(process.env.PORT || process.env.BACKEND_PORT || '3001', 10),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:3000',
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  certExpiryWarningDays: parseInt(process.env.CERT_EXPIRY_WARNING_DAYS || '30', 10),
  certExpiryCriticalDays: parseInt(process.env.CERT_EXPIRY_CRITICAL_DAYS || '7', 10),
}));
