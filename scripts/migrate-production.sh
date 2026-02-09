#!/bin/bash
# Run Prisma migrations against production database
#
# Requires DATABASE_URL to be set. Options:
#   1. Export before running: export DATABASE_URL="postgres://..." && ./scripts/migrate-production.sh
#   2. Or create .env.production (gitignored) with DATABASE_URL=... and run: source .env.production 2>/dev/null; ./scripts/migrate-production.sh

echo "🚀 Applying migrations to production database..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set."
  echo "   Set it from .env.production or export it before running this script."
  echo "   Example: export \$(grep DATABASE_URL .env.production | xargs) && ./scripts/migrate-production.sh"
  exit 1
fi

# Disable Node TLS certificate verification (for Prisma Cloud) - optional, remove if not needed
export NODE_TLS_REJECT_UNAUTHORIZED=0

npx prisma migrate deploy

result=$?
unset NODE_TLS_REJECT_UNAUTHORIZED

if [ $result -eq 0 ]; then
  echo "✅ Migrations applied successfully!"
else
  echo "❌ Migration failed. Check the error above."
  exit 1
fi
