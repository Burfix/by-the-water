import { registerAs } from '@nestjs/config';

function parseDatabaseUrl(url: string) {
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: parseInt(u.port || '5432', 10),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      name: u.pathname.replace(/^\//, ''),
    };
  } catch {
    return null;
  }
}

export default registerAs('database', () => {
  const url = process.env.DATABASE_URL;
  const parsed = url ? parseDatabaseUrl(url) : null;

  return {
    url: url || undefined,
    host: parsed?.host ?? process.env.DB_HOST ?? 'localhost',
    port: parsed?.port ?? parseInt(process.env.DB_PORT || '5432', 10),
    user: parsed?.user ?? process.env.DB_USER ?? 'compliance_user',
    password: parsed?.password ?? process.env.DB_PASSWORD ?? 'compliance_pass',
    name: parsed?.name ?? process.env.DB_NAME ?? 'compliance_db',
  };
});
