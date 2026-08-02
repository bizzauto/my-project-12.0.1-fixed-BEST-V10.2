#!/bin/bash

# ============================================
# 🔍 Evolution API Diagnostic Script
# Run this on VPS: bash diagnose-evolution.sh
# ============================================

echo "=========================================="
echo "🔍 Evolution API Diagnostic Check"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Find the app directory
APP_DIR=""
if [ -d "/root/saas-app" ]; then
    APP_DIR="/root/saas-app"
elif [ -d "/root/my project" ]; then
    APP_DIR="/root/my project"
else
    echo -e "${RED}✗ Cannot find app directory${NC}"
    exit 1
fi

echo -e "${GREEN}App directory: $APP_DIR${NC}"
echo ""

# ============================================
# 1. Check Docker Containers
# ============================================
echo -e "${YELLOW}[1/7] Docker Container Status:${NC}"
echo "-------------------------------------------"
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null
echo ""

# ============================================
# 2. Check Evolution API Container specifically
# ============================================
echo -e "${YELLOW}[2/7] Evolution API Container:${NC}"
echo "-------------------------------------------"
EVO_CONTAINER=$(docker ps -a --filter name=evolution --format '{{.Names}} {{.Status}}' 2>/dev/null)
if [ -n "$EVO_CONTAINER" ]; then
    echo -e "${GREEN}Found: $EVO_CONTAINER${NC}"
else
    echo -e "${RED}✗ No Evolution API container found!${NC}"
    echo -e "${YELLOW}This means Evolution API is not deployed separately.${NC}"
    echo -e "${YELLOW}Check if it's configured via env vars instead.${NC}"
fi
echo ""

# ============================================
# 3. Check .env file for Evolution API vars
# ============================================
echo -e "${YELLOW}[3/7] Environment Variables (Evolution API):${NC}"
echo "-------------------------------------------"
if [ -f "$APP_DIR/.env" ]; then
    echo -e "${GREEN}✓ .env file found${NC}"

    # Check each Evolution-related env var
    for var in EVOLUTION_API_URL EVOLUTION_API_KEY EVOLUTION_INSTANCE_NAME EVOLUTION_WEBHOOK_SECRET; do
        VALUE=$(grep "^${var}=" "$APP_DIR/.env" 2>/dev/null | cut -d'=' -f2-)
        if [ -n "$VALUE" ]; then
            # Mask API key for security
            if [[ "$var" == *"KEY"* ]] || [[ "$var" == *"SECRET"* ]]; then
                MASKED="${VALUE:0:8}...${VALUE: -4}"
                echo -e "  ${GREEN}✓ $var = $MASKED${NC}"
            else
                echo -e "  ${GREEN}✓ $var = $VALUE${NC}"
            fi
        else
            echo -e "  ${RED}✗ $var = NOT SET${NC}"
        fi
    done
else
    echo -e "${RED}✗ .env file NOT found at $APP_DIR/.env${NC}"
fi
echo ""

# ============================================
# 4. Check if Evolution API server is reachable
# ============================================
echo -e "${YELLOW}[4/7] Evolution API Connectivity:${NC}"
echo "-------------------------------------------"
EVO_URL=$(grep "^EVOLUTION_API_URL=" "$APP_DIR/.env" 2>/dev/null | cut -d'=' -f2-)
if [ -n "$EVO_URL" ]; then
    echo -e "Testing: $EVO_URL"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$EVO_URL" 2>/dev/null)
    if [ "$HTTP_CODE" != "000" ]; then
        echo -e "${GREEN}✓ Evolution API reachable (HTTP $HTTP_CODE)${NC}"

        # Try to get instance list
        EVO_KEY=$(grep "^EVOLUTION_API_KEY=" "$APP_DIR/.env" 2>/dev/null | cut -d'=' -f2-)
        if [ -n "$EVO_KEY" ]; then
            echo ""
            echo "Fetching instances..."
            INSTANCES=$(curl -s --connect-timeout 5 \
                -H "apikey: $EVO_KEY" \
                "$EVO_URL/instance/fetchInstances" 2>/dev/null)
            echo "$INSTANCES" | head -c 500
            echo ""
        fi
    else
        echo -e "${RED}✗ Evolution API NOT reachable!${NC}"
        echo -e "${YELLOW}The server at $EVO_URL is not responding.${NC}"
    fi
else
    echo -e "${RED}✗ No EVOLUTION_API_URL configured — cannot test connectivity${NC}"
fi
echo ""

# ============================================
# 5. Check App Logs for Evolution errors
# ============================================
echo -e "${YELLOW}[5/7] Recent Evolution API Errors (last 20 lines):${NC}"
echo "-------------------------------------------"
# Check Docker logs if app runs in Docker
APP_CONTAINER=$(docker ps --filter name=app --format '{{.Names}}' 2>/dev/null | head -1)
if [ -n "$APP_CONTAINER" ]; then
    docker logs "$APP_CONTAINER" --tail 200 2>&1 | grep -i "evolution\|Evolution\|EVOLUTION" | tail -20
    if [ ${PIPESTATUS[1]} -eq 0 ]; then
        echo -e "${GREEN}✓ Found Evolution-related logs above${NC}"
    else
        echo -e "${YELLOW}No Evolution-specific errors in recent logs${NC}"
    fi
else
    echo -e "${YELLOW}App container not found — checking if running locally...${NC}"
fi
echo ""

# ============================================
# 6. Check Integration table in database
# ============================================
echo -e "${YELLOW}[6/7] Database Integration Records:${NC}"
echo "-------------------------------------------"
# Check if we can query the database through the app container
if [ -n "$APP_CONTAINER" ]; then
    docker exec "$APP_CONTAINER" npx prisma db execute --stdin <<< "SELECT id, \"businessId\", type, name, \"isActive\", config::text FROM \"Integration\" WHERE type = 'evolution_api' LIMIT 5;" 2>/dev/null || \
    docker exec "$APP_CONTAINER" sh -c 'echo "SELECT id, businessId, type, name, isActive FROM \"Integration\" WHERE type = '"'"'evolution_api'"'"' LIMIT 5;" | psql $DATABASE_URL 2>/dev/null' || \
    echo -e "${YELLOW}Could not query database directly. Check via Prisma Studio or API.${NC}"
else
    echo -e "${YELLOW}App container not found — skip DB check${NC}"
fi
echo ""

# ============================================
# 7. Quick health check
# ============================================
echo -e "${YELLOW}[7/7] App Health Check:${NC}"
echo "-------------------------------------------"
HEALTH=$(curl -s --connect-timeout 5 http://localhost:4000/health 2>/dev/null)
if [ -n "$HEALTH" ]; then
    echo -e "${GREEN}Backend responding: $HEALTH${NC}"
else
    echo -e "${RED}✗ Backend not responding on port 4000${NC}"
fi
echo ""

# ============================================
# Summary
# ============================================
echo "=========================================="
echo -e "${YELLOW}📋 DIAGNOSIS SUMMARY${NC}"
echo "=========================================="
echo ""
echo "Paste this output to Claude for analysis."
echo "=========================================="
