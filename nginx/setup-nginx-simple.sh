#!/bin/bash

# Simple Nginx Setup Script - HTTP Only
# Script setup Nginx tanpa SSL

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "🔧 Nginx Setup (HTTP Only) - Dashboard Masjid"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: This script must be run as root (use sudo)${NC}"
    exit 1
fi

# Configuration
PROJECT_ROOT="/var/www/html/masjid"
DOMAIN="_"

echo -e "${CYAN}Configuration:${NC}"
echo "  Domain: $DOMAIN (accept all)"
echo "  Project Root: $PROJECT_ROOT"
echo ""

# Step 1: Install Nginx
echo -e "${YELLOW}Step 1: Installing Nginx...${NC}"
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✅ Nginx already installed${NC}"
else
    apt update
    apt install -y nginx
    echo -e "${GREEN}✅ Nginx installed${NC}"
fi

echo ""

# Step 2: Create directories
echo -e "${YELLOW}Step 2: Creating directories...${NC}"
mkdir -p "$PROJECT_ROOT"
mkdir -p /var/log/nginx
echo -e "${GREEN}✅ Directories created${NC}"

echo ""

# Step 3: Copy configuration
echo -e "${YELLOW}Step 3: Copying Nginx configuration...${NC}"

CONFIG_TEMPLATE="$ROOT_DIR/nginx/sites-available/dashboard-masjid-http"
CONFIG_FILE="/etc/nginx/sites-available/dashboard-masjid"

if [ -f "$CONFIG_TEMPLATE" ]; then
    cp "$CONFIG_TEMPLATE" "$CONFIG_FILE"
    echo -e "${GREEN}✅ Configuration copied${NC}"
else
    echo -e "${YELLOW}⚠️  Template not found, creating basic config...${NC}"
    
    cat > "$CONFIG_FILE" << EOF
server {
    listen 80;
    server_name _;
    
    root /var/www/html/masjid/dist/apps/web;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    location ~ ^/pb(/|\$)(.*) {
        proxy_pass http://127.0.0.1:8090/\$2;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
    
    echo -e "${GREEN}✅ Basic config created${NC}"
fi

echo ""

# Step 4: Enable site
echo -e "${YELLOW}Step 4: Enabling site...${NC}"
ln -sf "$CONFIG_FILE" /etc/nginx/sites-enabled/dashboard-masjid
rm -f /etc/nginx/sites-enabled/default
echo -e "${GREEN}✅ Site enabled${NC}"

echo ""

# Step 5: Test configuration
echo -e "${YELLOW}Step 5: Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Configuration test passed${NC}"
else
    echo -e "${RED}❌ Configuration test failed${NC}"
    exit 1
fi

echo ""

# Step 6: Restart Nginx
echo -e "${YELLOW}Step 6: Restarting Nginx...${NC}"
systemctl restart nginx
systemctl enable nginx
echo -e "${GREEN}✅ Nginx restarted${NC}"

echo ""

# Step 7: Firewall (if UFW available)
echo -e "${YELLOW}Step 7: Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx HTTP'
    echo -e "${GREEN}✅ Firewall configured${NC}"
else
    echo -e "${YELLOW}⏭️  UFW not available${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ Nginx Setup Completed!${NC}"
echo ""
echo -e "${CYAN}Configuration Summary:${NC}"
echo "  Config File: $CONFIG_FILE"
echo "  Project Root: $PROJECT_ROOT"
echo "  Port: 80 (HTTP only)"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Upload application: scp -r Dashboard-Masjid user@server:$PROJECT_ROOT"
echo "  2. Build frontend: cd $PROJECT_ROOT && npm run build"
echo "  3. Start services: pm2 start ecosystem.config.js"
echo "  4. Test: http://your-server-ip"
echo ""
echo -e "${YELLOW}SSL Setup (Manual):${NC}"
echo "  1. Install certbot: apt install certbot python3-certbot-nginx"
echo "  2. Get certificate: certbot --nginx -d your-domain.com"
echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo "  - Status: systemctl status nginx"
echo "  - Restart: systemctl restart nginx"
echo "  - Logs: tail -f /var/log/nginx/dashboard-masjid.error.log"
echo "  - Test: nginx -t"
echo ""
