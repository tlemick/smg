#!/bin/bash
# Run Prisma migrations against production database

echo "🚀 Applying migrations to production database..."

# Disable Node TLS certificate verification (for Prisma Cloud)
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Use production DATABASE_URL
DATABASE_URL="postgres://24946c1147dc2505d0934eaa2979ba995530107cf178b401a492f85eafd2968f:sk_a_I7v8SSmUS-xpTFR4Mcw@db.prisma.io:5432/postgres?sslmode=require" npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Migrations applied successfully!"
  unset NODE_TLS_REJECT_UNAUTHORIZED
else
  echo "❌ Migration failed. Check the error above."
  unset NODE_TLS_REJECT_UNAUTHORIZED
  exit 1
fi
