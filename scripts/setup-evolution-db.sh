#!/bin/bash
# Setup Evolution API DB on existing Supabase Postgres (no secrets in repo)
set -e

APP_ENV=/data/coolify/applications/m3c0lqsr2ftta3azztxl135e/.env
DBHOST=supabase-db-ls3ehizkv5guirww9wlazwrv

DBURL=$(grep '^DATABASE_URL=' "$APP_ENV" | cut -d= -f2-)
PASS=$(echo "$DBURL" | sed -E 's|^postgresql://[^:]+:([^@]+)@.*|\1|')

echo "Creating evolution database (if missing)..."
docker exec $DBHOST psql -U supabase_admin -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='evolution'" | grep -q 1 \
  || docker exec $DBHOST psql -U supabase_admin -d postgres -c "CREATE DATABASE evolution"

EVO_URL="postgresql://supabase_admin:${PASS}@${DBHOST}:5432/evolution?schema=public"

cat > /root/evolution-api/.env <<EOF
AUTHENTICATION_API_KEY=tqWleh1dZ_42w8hjxssNwpLF6ZxdXrHVzOYMzINc
AUTHENTICATION_TYPE=apikey
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=${EVO_URL}
DATABASE_CONNECTION_CLIENT_NAME=evolution_api
SERVER_URL=https://bizzautoai.com
LOG_LEVEL=WARN
PORT=8080
EOF

chmod 600 /root/evolution-api/.env
echo "OK - /root/evolution-api/.env written (password not printed)"
