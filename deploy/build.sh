#!/bin/bash

# Build script untuk deployment di Linux/Mac
# Usage: ./deploy/build.sh

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
WEB_DIR="$ROOT_DIR/apps/web"

echo "🔨 Starting build process..."
echo ""

# Navigate to web directory
cd "$WEB_DIR"

# Clean previous build
echo "🧹 Cleaning previous build..."
npm run clean 2>/dev/null || true

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run build
echo "📝 Running generate-llms.js..."
node tools/generate-llms.js || echo "⚠️  generate-llms.js failed (continuing anyway)..."

echo "📦 Running Vite build..."
npx vite build --outDir ../../dist/apps/web

echo ""
echo "✅ Build completed successfully!"
echo "📁 Output directory: $ROOT_DIR/dist/apps/web"
echo ""
