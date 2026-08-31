#!/bin/bash

# Post-Deploy Setup Script untuk Linux/Mac
# Script ini akan:
# 1. Set permissions untuk PocketBase binary
# 2. Install dependencies jika belum
# 3. Build frontend jika belum
# 4. Setup environment variables

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "🔧 Post-Deploy Setup - Dashboard Masjid" -ForegroundColor Cyan
echo "========================================" -ForegroundColor Cyan
echo ""
echo "📁 Working directory: $ROOT_DIR"
echo ""

# Step 1: Set permissions untuk PocketBase binary
echo "📝 Step 1: Setting PocketBase binary permissions..." -ForegroundColor Yellow
POCKETBASE_BINARY="$ROOT_DIR/apps/pocketbase/pocketbase"

if [ -f "$POCKETBASE_BINARY" ]; then
    chmod +x "$POCKETBASE_BINARY"
    echo "✅ PocketBase binary is now executable" -ForegroundColor Green
else
    echo "❌ PocketBase binary not found!" -ForegroundColor Red
    echo "   Please download PocketBase from https://pocketbase.io/docs/" -ForegroundColor Red
    echo "   and place it at: $POCKETBASE_BINARY" -ForegroundColor Red
    exit 1
fi

echo ""

# Step 2: Check if dependencies are installed
echo "📦 Step 2: Checking dependencies..." -ForegroundColor Yellow

if [ ! -d "$ROOT_DIR/node_modules" ]; then
    echo "   Installing root dependencies..." -ForegroundColor Cyan
    cd "$ROOT_DIR" && npm install
else
    echo "✅ Root dependencies installed" -ForegroundColor Green
fi

if [ ! -d "$ROOT_DIR/apps/web/node_modules" ]; then
    echo "   Installing web dependencies..." -ForegroundColor Cyan
    cd "$ROOT_DIR/apps/web" && npm install
else
    echo "✅ Web dependencies installed" -ForegroundColor Green
fi

if [ ! -d "$ROOT_DIR/apps/api/node_modules" ]; then
    echo "   Installing API dependencies..." -ForegroundColor Cyan
    cd "$ROOT_DIR/apps/api" && npm install
else
    echo "✅ API dependencies installed" -ForegroundColor Green
fi

if [ ! -d "$ROOT_DIR/apps/pocketbase/node_modules" ]; then
    echo "   Installing PocketBase dependencies..." -ForegroundColor Cyan
    cd "$ROOT_DIR/apps/pocketbase" && npm install
else
    echo "✅ PocketBase dependencies installed" -ForegroundColor Green
fi

echo ""

# Step 3: Check if build exists
echo "🔨 Step 3: Checking build..." -ForegroundColor Yellow

if [ ! -d "$ROOT_DIR/dist/apps/web" ]; then
    echo "   Build not found. Building frontend..." -ForegroundColor Cyan
    cd "$ROOT_DIR" && npm run build
    echo "✅ Build completed" -ForegroundColor Green
else
    echo "✅ Build already exists" -ForegroundColor Green
fi

echo ""

# Step 4: Check environment files
echo "⚙️  Step 4: Checking environment files..." -ForegroundColor Yellow

ENV_FILES=(
    "$ROOT_DIR/apps/pocketbase/.env"
    "$ROOT_DIR/apps/api/.env"
    "$ROOT_DIR/apps/web/.env"
)

for env_file in "${ENV_FILES[@]}"; do
    if [ -f "$env_file" ]; then
        echo "✅ $(basename $(dirname $env_file))/.env exists" -ForegroundColor Green
    else
        echo "⚠️  $(basename $(dirname $env_file))/.env not found" -ForegroundColor Yellow
        echo "   Please create this file with appropriate environment variables" -ForegroundColor Yellow
    fi
done

echo ""

# Step 5: Setup PM2 (optional)
echo "🚀 Step 5: PM2 Setup (optional)..." -ForegroundColor Yellow
read -p "Do you want to setup PM2 for process management? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v pm2 &> /dev/null; then
        echo "   Installing PM2..." -ForegroundColor Cyan
        npm install -g pm2
    fi
    
    echo "   Setting up PM2 startup..." -ForegroundColor Cyan
    pm2 startup
    
    echo "   Saving PM2 configuration..." -ForegroundColor Cyan
    pm2 save
    
    echo "✅ PM2 setup completed" -ForegroundColor Green
else
    echo "⏭️  Skipping PM2 setup" -ForegroundColor Yellow
fi

echo ""

# Summary
echo "========================================" -ForegroundColor Cyan
echo "✅ Post-Deploy Setup Completed!" -ForegroundColor Green
echo ""
echo "📋 Next Steps:" -ForegroundColor Cyan
echo "   1. Review and update environment variables in .env files" -ForegroundColor White
echo "   2. Start the application:" -ForegroundColor White
echo "      - Using PM2: pm2 start ecosystem.config.js" -ForegroundColor White
echo "      - Manual: npm run start" -ForegroundColor White
echo "   3. Setup Nginx reverse proxy (see DEPLOYMENT.md)" -ForegroundColor White
echo "   4. Setup SSL certificate (see DEPLOYMENT.md)" -ForegroundColor White
echo ""
echo "📖 Documentation:" -ForegroundColor Cyan
echo "   - PM2 Guide: PM2-GUIDE.md" -ForegroundColor White
echo "   - Deployment: DEPLOYMENT.md" -ForegroundColor White
echo "   - Quick Deploy: DEPLOY.md" -ForegroundColor White
echo ""
