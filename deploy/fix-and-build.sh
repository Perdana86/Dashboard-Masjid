#!/bin/bash

# Script untuk fix build error di VPS Linux
# Jalankan script ini jika mengalami error saat npm run build

set -e

echo "🔧 Fixing build compatibility for Linux..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

echo "📁 Working directory: $ROOT_DIR"
echo ""

# Step 1: Ensure all dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   Installing root dependencies..."
    npm install
fi

if [ ! -d "apps/web/node_modules" ]; then
    echo "   Installing web dependencies..."
    cd apps/web && npm install && cd ../..
fi

if [ ! -d "apps/api/node_modules" ]; then
    echo "   Installing api dependencies..."
    cd apps/api && npm install && cd ../..
fi

if [ ! -d "apps/pocketbase/node_modules" ]; then
    echo "   Installing pocketbase dependencies..."
    cd apps/pocketbase && npm install && cd ../..
fi

echo "✅ Dependencies installed"
echo ""

# Step 2: Make build script executable
echo "🔨 Setting up build scripts..."
chmod +x deploy/build.sh 2>/dev/null || true
chmod +x apps/web/scripts/build.js 2>/dev/null || true
echo "✅ Build scripts ready"
echo ""

# Step 3: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/apps/web 2>/dev/null || true
echo "✅ Cleaned"
echo ""

# Step 4: Run build
echo "🚀 Running build..."
cd apps/web
npm run build

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Verify build output: ls -la ../../dist/apps/web"
echo "   2. Setup PM2: pm2 start ecosystem.config.js"
echo "   3. Configure Nginx (see DEPLOYMENT.md)"
echo ""
