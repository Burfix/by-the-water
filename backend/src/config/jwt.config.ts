import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET is missing or too short (min 32 chars)');
  }
  if (!refreshSecret || refreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET is missing or too short (min 32 chars)');
  }

  return {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    cookieSecure: process.env.NODE_ENV === 'production',
    cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  };
});
