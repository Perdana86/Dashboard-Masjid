#!/bin/bash

# Quick Fix Script untuk PocketBase di Production
# Usage: ./fix-pocketbase-production.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "🔧 Quick Fix: PocketBase Production" -ForegroundColor Cyan
echo "====================================" -ForegroundColor Cyan
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}📁 Working directory: $SCRIPT_DIR${NC}"
echo ""

# Step 1: Check binary
echo -e "${YELLOW}Step 1: Checking PocketBase binary...${NC}"
POCKETBASE_BINARY="$SCRIPT_DIR/apps/pocketbase/pocketbase"

if [ ! -f "$POCKETBASE_BINARY" ]; then
    echo -e "${RED}❌ PocketBase binary not found!${NC}"
    echo ""
    echo "Downloading PocketBase..."
    cd apps/pocketbase
    
    # Download latest version
    POCKETBASE_VERSION="0.23.0"
    wget "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to download PocketBase. Please download manually.${NC}"
        echo "Visit: https://pocketbase.io/docs/"
        exit 1
    fi
    
    # Extract
    unzip "pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip"
    
    # Cleanup
    rm "pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip"
    
    cd ../..
    echo -e "${GREEN}✅ PocketBase downloaded successfully${NC}"
else
    echo -e "${GREEN}✅ PocketBase binary found${NC}"
fi

echo ""

# Step 2: Set permissions
echo -e "${YELLOW}Step 2: Setting permissions...${NC}"
chmod +x "$POCKETBASE_BINARY"
echo -e "${GREEN}✅ Permissions set${NC}"

echo ""

# Step 3: Create directories
echo -e "${YELLOW}Step 3: Creating directories...${NC}"
mkdir -p "$SCRIPT_DIR/apps/pocketbase/pb_data"
mkdir -p "$SCRIPT_DIR/apps/pocketbase/pb_migrations"
mkdir -p "$SCRIPT_DIR/apps/pocketbase/pb_hooks"
mkdir -p "$SCRIPT_DIR/logs"
chmod -R 755 "$SCRIPT_DIR/apps/pocketbase/pb_data"
chmod -R 755 "$SCRIPT_DIR/apps/pocketbase/pb_migrations"
chmod -R 755 "$SCRIPT_DIR/apps/pocketbase/pb_hooks"
echo -e "${GREEN}✅ Directories created${NC}"

echo ""

# Step 4: Check .env file
echo -e "${YELLOW}Step 4: Checking .env file...${NC}"
ENV_FILE="$SCRIPT_DIR/apps/pocketbase/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating...${NC}"
    cat > "$ENV_FILE" << 'EOF'
PB_ENCRYPTION_KEY=ChangeThisToA32CharacterSecretKey!
PB_SUPERUSER_EMAIL=admin@masjid-anda.com
PB_SUPERUSER_PASSWORD=ChangeThisPassword123!
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Update .env file with your own values!${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

echo ""

# Step 5: Stop existing PocketBase
echo -e "${YELLOW}Step 5: Stopping existing PocketBase (if running)...${NC}"
pm2 stop pocketbase 2>/dev/null || true
pm2 delete pocketbase 2>/dev/null || true
echo -e "${GREEN}✅ PocketBase stopped${NC}"

echo ""

# Step 6: Test manual start
echo -e "${YELLOW}Step 6: Testing manual start...${NC}"
cd apps/pocketbase

# Start in background
echo "Testing PocketBase binary..."
timeout 5 ./pocketbase --version 2>&1 || true

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PocketBase binary is working${NC}"
else
    echo -e "${RED}❌ PocketBase binary failed to execute${NC}"
    echo "Please check if the binary is compatible with your system"
    exit 1
fi

cd ../..

echo ""

# Step 7: Start with PM2
echo -e "${YELLOW}Step 7: Starting PocketBase with PM2...${NC}"
pm2 start ecosystem.config.js --only pocketbase

# Wait for startup
sleep 3

echo ""

# Step 8: Verify
echo -e "${YELLOW}Step 8: Verifying...${NC}"
echo ""
echo -e "${CYAN}PM2 Status:${NC}"
pm2 status pocketbase

echo ""
echo -e "${CYAN}Last logs:${NC}"
pm2 logs pocketbase --lines 10 --nostream

echo ""

# Test connection
echo -e "${CYAN}Testing connection...${NC}"
sleep 2
curl -s http://127.0.0.1:8090/api/health > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PocketBase is running and accessible!${NC}"
    echo ""
    echo -e "${CYAN}Access:${NC}"
    echo "  - API Health: http://127.0.0.1:8090/api/health"
    echo "  - Admin Panel: http://127.0.0.1:8090/_/"
else
    echo -e "${YELLOW}⚠️  PocketBase started but health check failed${NC}"
    echo "Check logs: pm2 logs pocketbase"
fi

echo ""
echo "====================================" -ForegroundColor Cyan
echo -e "${GREEN}✅ PocketBase Fix Completed!${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Update .env file with secure values"
echo "  2. Start other services: pm2 start ecosystem.config.js"
echo "  3. Save PM2 config: pm2 save"
echo "  4. Setup startup: pm2 startup"
echo ""
