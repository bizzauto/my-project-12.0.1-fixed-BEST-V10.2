#!/bin/bash
# Update main app .env: real EVOLUTION_API_KEY + WEBHOOK_SECRET (no secrets printed)
set -e
ENV_FILE=/data/coolify/applications/m3c0lqsr2ftta3azztxl135e/.env
cp "$ENV_FILE" "$ENV_FILE.bak-$(date +%s)"

sed -i 's|^EVOLUTION_API_KEY=.*|EVOLUTION_API_KEY=tqWleh1dZ_42w8hjxssNwpLF6ZxdXrHVzOYMzINc|' "$ENV_FILE"
if ! grep -q '^EVOLUTION_WEBHOOK_SECRET=' "$ENV_FILE"; then
  echo 'EVOLUTION_WEBHOOK_SECRET=b9b64eb6a59280c7244bc836439a9fa6' >> "$ENV_FILE"
fi
echo "--- EVOLUTION vars now ---"
grep '^EVOLUTION_' "$ENV_FILE" | sed 's/=\(.\{12\}\).*/=\1.../'
