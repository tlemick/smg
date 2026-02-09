# Env vars and local vs Vercel workflow

## Database URL

The app uses **Prisma** with **Prisma Postgres**. The schema uses a single connection string:

| Env var | Used for | Set to |
|--------|----------|--------|
| `DATABASE_URL` | Next.js app, API routes, seed script, migrations | Direct Postgres URL (`postgres://...@db.prisma.io:5432/postgres?sslmode=require`) |

**Note:** The standard Prisma Client (`prisma-client-js`) does not support the `prisma+postgres://` (Accelerate) URL scheme. To use Accelerate you’d need the Accelerate adapter and a different setup. This project uses the direct Postgres URL everywhere. If you see a local TLS error when running the seed, it’s a Node/OpenSSL vs. the DB certificate; try running the seed from another environment (e.g. CI) or updating Node.

---

## Which env file is used when

| Context | File(s) loaded | Notes |
|--------|----------------|--------|
| **`npm run dev`** (Next.js) | `.env.local` then `.env` | Next.js dev loads `.env.local` automatically. |
| **`npm run build` / `npm run start`** (Next.js, local) | `.env.production` then `.env` | Only when running a production build locally. |
| **Seed script** (`npx tsx scripts/seed-demo-investors.ts`) | **`.env.local` only** | Script explicitly loads `.env.local`. |
| **Prisma CLI** (`prisma migrate dev`, `prisma generate`) | **`.env`** (in project root) | Prisma does *not* load `.env.local` or `.env.production`. Put `DATABASE_URL` in `.env` for migrations, or run e.g. `dotenv -e .env.local -- prisma migrate dev`. |
| **Vercel (deployed app)** | **Dashboard env vars only** | Vercel does not use `.env.production` from the repo. You configure Production/Preview env in the Vercel project settings. |

So you have **two local files** that matter:

- **`.env.local`** — dev app and seed script (Next.js loads it). Should contain `DATABASE_URL` (direct Postgres).
- **`.env.production`** — only for **local** production builds (`next build` / `next start`). On Vercel, the deployed app uses the dashboard, not this file.

---

## What to put in each file

**`.env.local`** (gitignored) — local dev + seed:

```bash
DATABASE_URL="postgres://...@db.prisma.io:5432/postgres?sslmode=require"
# ... other dev-only vars (e.g. JWT_SECRET, NEXT_PUBLIC_*)
```

**`.env.production`** — local production build only (optional):

```bash
DATABASE_URL="postgres://..."
# ... same var names as production
```

- If `.env.production` is **gitignored**: safe to put real production values for local `next build`/`next start`.
- If it’s **committed**: use placeholders or omit secrets; real production values live only in Vercel (and CI).

**Vercel** — Project → Settings → Environment Variables:

- Set `DATABASE_URL` (and all other production vars) for Production and/or Preview. The deployed app uses these; it does **not** read `.env.production` from the repo.

---

## Daily workflow

- **Dev:** `npm run dev` → uses `.env.local`.
- **Seed:** `npx tsx scripts/seed-demo-investors.ts` → uses `.env.local`.
- **Migrations:** Put `DATABASE_URL` in root **`.env`** and run `npx prisma migrate dev`, or run `dotenv -e .env.local -- npx prisma migrate dev` (requires `dotenv-cli`: `npm i -D dotenv-cli`).
- **Deploy:** Push to your branch; Vercel builds and runs with **dashboard** env vars. No need to push `.env.local` or `.env.production` for the deployed app.

---

## Making changes “here and there”

- **Code:** One repo. Edit locally, push → Vercel picks it up.
- **Env:** Three places to think about:
  - **`.env.local`** — local dev + seed.
  - **`.env.production`** — only if you run production builds locally; Vercel ignores this file.
  - **Vercel dashboard** — what the deployed app actually uses.
- **Database:** One DB. Local and Vercel both use `DATABASE_URL` (direct Postgres).

---

## Quick checklist

- [ ] `.env.local` has `DATABASE_URL` (direct Postgres URL).
- [ ] `.env.production` has `DATABASE_URL` if you run `next build`/`next start` locally.
- [ ] Root `.env` has `DATABASE_URL` if you run `prisma migrate dev` without loading `.env.local`.
- [ ] Vercel has `DATABASE_URL` set in the project’s Environment Variables.
