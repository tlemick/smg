# Cron Job Fixes - Portfolio & Ranking Errors

## Problems Identified

### 1. Prisma Client Import Issues
**Error:** `Cannot read properties of undefined (reading 'findMany')`

**Root Cause:** 
- Files were using fragile relative paths like `../../../../../prisma/client`
- In serverless/Vercel environments, these paths can break after build
- The Prisma client was undefined when cron jobs tried to access the database

**Affected Files:** 40+ files across the codebase

### 2. Missing CRON_SECRET Environment Variable
**Error:** Cron jobs failing authentication

**Root Cause:**
- `/api/jobs/compute-performance` route expects `CRON_SECRET` env var (line 31)
- This variable was not set in `.env.local` or `.env.production`
- Vercel cron jobs couldn't authenticate

## Fixes Applied

### 1. Added Path Alias for Prisma (✅ Fixed Locally)

**File: `tsconfig.json`**
```json
"paths": {
  "@/*": ["./src/*"],
  "@/prisma/*": ["./prisma/*"]  // NEW: Consistent import path
}
```

### 2. Updated All Prisma Imports (✅ Fixed Locally)

**Before:**
```typescript
import { prisma } from '../../../../../prisma/client';
import { prisma } from '../../prisma/client';
```

**After:**
```typescript
import { prisma } from '@/prisma/client';  // Consistent everywhere
```

**Files Updated:** 41 files including:
- `/api/user/ranking/route.ts`
- `/api/user/portfolio/overview/route.ts`
- `/lib/performance-computation-service.ts`
- `/lib/yahoo-finance-service.ts`
- All other API routes and services

### 3. Added CRON_SECRET to Local Environment (✅ Fixed Locally)

**File: `.env.local`**
```bash
CRON_SECRET="local-dev-cron-secret-2025"
```

## Required Vercel Configuration (⚠️ ACTION NEEDED)

### Step 1: Add CRON_SECRET Environment Variable

1. Go to your Vercel project dashboard: https://vercel.com/tllemicks-projects/smg
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** Generate a secure random string (e.g., use `openssl rand -base64 32`)
   - **Environments:** Production, Preview, Development

**Example:**
```bash
# Generate a secure secret
openssl rand -base64 32
# Output: aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890ABCD=

# Add to Vercel:
CRON_SECRET="aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890ABCD="
```

### Step 2: Verify DATABASE_URL is Set

Check that `DATABASE_URL` exists in your Vercel environment variables:
- Should match the value in `.env.production`
- Current value: `postgres://...@db.prisma.io:5432/postgres?sslmode=require`

### Step 3: Redeploy

After adding the environment variable, trigger a new deployment:
```bash
# Push changes (this will trigger automatic deployment)
git add .
git commit -m "fix: Update Prisma imports to use path alias, add CRON_SECRET"
git push
```

Or manually redeploy from Vercel dashboard.

## Testing Locally

### 1. Test Database Connection
```bash
cd /Users/londinium/Code/smg_front
npx prisma db push  # Should succeed
```

### 2. Test Portfolio Overview API
```bash
# Start dev server
npm run dev

# In another terminal, test the endpoint
curl http://localhost:3000/api/user/portfolio/overview \
  -H "Cookie: user_session=<your-session-cookie>"
```

### 3. Test Ranking API
```bash
curl http://localhost:3000/api/user/ranking \
  -H "Cookie: user_session=<your-session-cookie>"
```

### 4. Test Cron Jobs

**Test Performance Computation:**
```bash
curl -X POST http://localhost:3000/api/jobs/compute-performance \
  -H "Authorization: Bearer 75fUsd4PqZYxLU65LWcbRYoBBl3L6ZZ6A8CRj0USHPg" \
  -H "Content-Type: application/json"
```

**Test Order Processing:**
```bash
curl -X POST http://localhost:3000/api/trade/process-orders \
  -H "Authorization: Bearer 75fUsd4PqZYxLU65LWcbRYoBBl3L6ZZ6A8CRj0USHPg" \
  -H "Content-Type: application/json"
```

## Vercel Cron Configuration

Your current cron jobs (from `vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/trade/process-orders",
      "schedule": "*/2 9-16 * * 1-5"  // Every 2 mins, 9am-4pm, Mon-Fri
    },
    {
      "path": "/api/jobs/compute-performance",
      "schedule": "0 22 * * *"  // Daily at 10 PM
    }
  ]
}
```

## How Vercel Cron Authentication Works

Vercel automatically adds these headers to cron requests:
- `x-vercel-cron-secret`: Matches `CRON_SECRET` env var
- No need to manually set `Authorization` header for Vercel crons

The code checks for BOTH authentication methods:
```typescript
const isAuthorized =
  (apiKey && apiKey === AUTHORIZED_API_KEY) ||  // Manual API calls
  (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret);  // Vercel crons
```

## Expected Behavior After Fix

### Local Development
- ✅ All API routes can import Prisma without path issues
- ✅ Cron jobs can be tested manually with API key
- ✅ No more "Cannot read properties of undefined" errors

### Production (Vercel)
- ✅ Cron jobs authenticate automatically via `CRON_SECRET`
- ✅ Prisma client initializes correctly in serverless functions
- ✅ Portfolio overview and ranking APIs work reliably
- ✅ Performance computation runs nightly without errors
- ✅ Order processing runs every 2 minutes during market hours

## Monitoring on Vercel

### Check Cron Job Logs

1. Go to Vercel dashboard
2. Navigate to **Deployments** → Select latest deployment
3. Click **Functions** → Find the cron function
4. View logs for execution history and errors

### Check for Errors

Look for these log patterns:
- ✅ **Good:** `"Performance computation completed in 2.34s"`
- ✅ **Good:** `"Processed 5 orders (3 executed, 2 expired)"`
- ❌ **Bad:** `"Cannot read properties of undefined"`
- ❌ **Bad:** `"Unauthorized"`

## Troubleshooting

### If Portfolio API Still Fails

1. **Check Environment Variables:**
   ```bash
   vercel env pull .env.vercel.local
   cat .env.vercel.local | grep DATABASE_URL
   ```

2. **Check Prisma Client Generation:**
   ```bash
   npx prisma generate
   npm run build  # Ensure build succeeds
   ```

3. **Check Vercel Build Logs:**
   - Look for Prisma generation errors
   - Look for TypeScript compilation errors related to imports

### If Cron Jobs Still Fail

1. **Verify CRON_SECRET is set:**
   - Go to Vercel → Settings → Environment Variables
   - Confirm `CRON_SECRET` exists for all environments

2. **Check Cron Execution Logs:**
   - Vercel Dashboard → Functions → Select cron function
   - Look for authentication errors

3. **Manual Test:**
   ```bash
   curl -X POST https://smg-rose.vercel.app/api/jobs/compute-performance \
     -H "Authorization: Bearer YOUR_ORDER_PROCESSING_API_KEY"
   ```

## Summary of Changes

| File | Change | Status |
|------|--------|--------|
| `tsconfig.json` | Added `@/prisma/*` path alias | ✅ Complete |
| `.env.local` | Added `CRON_SECRET` | ✅ Complete |
| 41 files | Updated Prisma imports to use `@/prisma/client` | ✅ Complete |
| Vercel env vars | Add `CRON_SECRET` | ⚠️ Manual Action Required |

## Next Steps

1. ✅ Local changes are complete - test locally
2. ⚠️ Add `CRON_SECRET` to Vercel (see Step 1 above)
3. ⚠️ Commit and push changes
4. ✅ Verify deployment succeeds
5. ✅ Monitor cron job logs for 24 hours

## Questions?

If you encounter any issues:
1. Check Vercel deployment logs
2. Check cron execution logs
3. Verify all environment variables are set
4. Test the API endpoints manually using curl

The root issue was fragile import paths combined with missing authentication. These fixes address both problems systematically.
