#!/bin/bash

# Production Build Script for Masjid Dashboard
# Usage: bash deploy/build.sh

set -e  # Exit on error

echo "🔨 Starting production build..."
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( dirname "$SCRIPT_DIR" )"

cd "$ROOT_DIR"

echo "📂 Working directory: $(pwd)"
echo ""

# Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node.js: $NODE_VERSION"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
    echo ""
fi

# Set permissions
echo "🔐 Setting permissions..."
chmod +x apps/pocketbase/pocketbase 2>/dev/null || true
chmod +x deploy/*.sh 2>/dev/null || true
echo "   ✓ Permissions set"
echo ""

# Run pre-build script
echo "📝 Running pre-build script..."
node apps/web/tools/generate-llms.js || echo "   ⚠️  Pre-build script skipped"
echo ""

# Build web app
echo "🏗️  Building web application..."
npm run build --workspace=apps/web
echo ""

# Verify build output
if [ -d "dist/apps/web" ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📊 Build output:"
    ls -lh dist/apps/web/ | tail -n +2
    echo ""
    
    # Count files
    FILE_COUNT=$(find dist/apps/web -type f | wc -l)
    echo "   Total files: $FILE_COUNT"
    
    # Calculate size
    BUILD_SIZE=$(du -sh dist/apps/web | cut -f1)
    echo "   Total size: $BUILD_SIZE"
    echo ""
else
    echo "❌ Build failed! Output directory not found."
    exit 1
fi

echo "🎉 Build completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Upload dist/ folder to server"
echo "  2. Upload apps/pocketbase/pocketbase binary"
echo "  3. Run: bash deploy/post-deploy-setup.sh"
echo "  4. Start: npm run start"
echo ""
