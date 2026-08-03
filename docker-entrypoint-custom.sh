#!/bin/sh
set -e

# Replace __BACKEND_URL__ placeholder in nginx config with actual value
# This runs BEFORE nginx starts, guaranteed to work with any env var setup

BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"

echo "[entrypoint] Replacing backend URL with: ${BACKEND_URL}"

# Replace placeholder in conf.d template
if [ -f /etc/nginx/templates/default.conf.template ]; then
    sed -i "s|__BACKEND_URL__|${BACKEND_URL}|g" /etc/nginx/templates/default.conf.template
    # Copy to conf.d
    cp /etc/nginx/templates/default.conf.template /etc/nginx/conf.d/default.conf
    echo "[entrypoint] Config copied to conf.d with BACKEND_URL=${BACKEND_URL}"
elif [ -f /etc/nginx/conf.d/default.conf ]; then
    sed -i "s|__BACKEND_URL__|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf
    echo "[entrypoint] Config patched in conf.d with BACKEND_URL=${BACKEND_URL}"
fi

echo "[entrypoint] Starting nginx..."
exec nginx -g "daemon off;"
