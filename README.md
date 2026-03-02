# By The Water — Compliance & Audit Management

> Pilot-ready NestJS (backend) + Next.js (frontend) monorepo.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS — deployed on **Vercel** |
| Backend | NestJS 10, TypeORM, Passport-JWT — deployed on **Railway** (or any Node host) |
| Database | PostgreSQL 16 |
| Storage | AWS S3 (or S3-compatible) |

---

## Local Setup

### Prerequisites
- Node.js ≥ 20
- PostgreSQL 14+ running on `localhost:5432`

### 1. Clone & install

```bash
git clone https://github.com/Burfix/by-the-water.git
cd by-the-water

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in DB credentials and generate JWT secrets:
#   openssl rand -hex 64  (run twice — one for JWT_SECRET, one for JWT_REFRESH_SECRET)
```

```bash
cp frontend/.env.local.example frontend/.env.local  # if you add one, or use the defaults:
# NEXT_PUBLIC_API_URL=/api/v1
# BACKEND_URL=http://localhost:3001
```

### 3. Seed the database

```bash
cd backend && npm run seed
```

Seed output lists credentials for all pilot users.

### 4. Start services

**Terminal 1 — backend:**
```bash
cd backend && npm run start:dev
# → http://localhost:3001/api/v1
# → http://localhost:3001/api/docs  (Swagger)
```

**Terminal 2 — frontend:**
```bash
cd frontend && npm run dev
# → http://localhost:3000
```

---

## Environment Variables

### Root `.env` (backend reads this)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `local` / `development` / `staging` / `production`. Use `local` on dev machine. |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | ✅ | PostgreSQL connection |
| `JWT_SECRET` | ✅ | Min 64 chars — `openssl rand -hex 64` |
| `JWT_EXPIRES_IN` | | Access token TTL. Default: `15m` |
| `JWT_REFRESH_SECRET` | ✅ | Different from JWT_SECRET. Min 64 chars. |
| `JWT_REFRESH_EXPIRES_IN` | | Refresh token TTL. Default: `7d` |
| `CORS_ORIGINS` | ✅ | Comma-separated. Include Vercel URL in prod. |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` | ✅ prod | S3 storage |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | | Used by `npm run seed` only |

### Frontend env (Vercel project settings OR `frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Always `/api/v1` — browser calls are proxied by Next.js to `BACKEND_URL` |
| `BACKEND_URL` | ✅ prod | The deployed backend URL, e.g. `https://api.bythewater.app`. Never exposed to browser. |

---

## Database Migrations

TypeORM `synchronize` is **only enabled** when `NODE_ENV=local`.  
All other environments (development, staging, production) require explicit migrations.

```bash
# Generate a migration from entity changes
cd backend && npm run migration:generate -- -n MigrationName

# Apply pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

> **Deploy checklist:** always run `npm run migration:run` before starting the backend in staging/prod.

---

## Deploying the Pilot

### Backend → Railway (or Render / Fly.io)

1. Create a new Railway project, add a PostgreSQL service.
2. Set env vars (see table above). Set `NODE_ENV=production`.
3. Set start command: `npm run start:prod`
4. On first deploy, run migrations: `npm run migration:run`
5. Run seed once: `npm run seed`
6. Copy the public Railway URL, e.g. `https://compliance-api.up.railway.app`

### Frontend → Vercel

1. Import the repo into Vercel. Set **Root Directory** to `frontend`.
2. Add env vars in Vercel project settings:
   - `NEXT_PUBLIC_API_URL` = `/api/v1`
   - `BACKEND_URL` = `https://compliance-api.up.railway.app` (your Railway URL)
3. Deploy. Vercel will proxy `/api/v1/*` → Railway via `next.config.mjs` rewrites.

> Cookies are **same-origin** via the proxy — no CORS or `SameSite=None` headaches.

---

## Auth Architecture

- Login/register sets **httpOnly** cookies (`access_token` 15 min, `refresh_token` 7 days).
- The frontend never reads tokens from JS — cookies are invisible to client-side code.
- On 401, the Axios interceptor silently calls `POST /auth/refresh` to rotate tokens.
- Logout calls `POST /auth/logout` which clears both cookies server-side.
- Next.js Edge Middleware reads the `access_token` cookie for route protection and RBAC.

---

## Health Checks

```bash
# Liveness (process up)
curl http://localhost:3001/api/v1/health

# Readiness (DB reachable)
curl http://localhost:3001/api/v1/ready
```

---

## Security Notes

- ❌ Never commit `.env` — the root `.env` is in `.gitignore`. CI will fail if it's detected.
- 🔑 Rotate `JWT_SECRET` and `JWT_REFRESH_SECRET` in production — generate with `openssl rand -hex 64`.
- 🧹 If secrets were ever committed, purge git history: `git filter-repo --path .env --invert-paths`
