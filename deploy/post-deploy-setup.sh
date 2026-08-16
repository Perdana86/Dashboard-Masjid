#!/bin/bash

# Post-deployment setup script
# This script fixes permission issues and ensures everything is set up correctly

set -e

echo "🔧 Post-Deployment Setup"
echo "======================="
echo ""

# Check if running in Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📝 Setting up permissions..."
    
    # Set execute permission for PocketBase binary
    if [ -f "apps/pocketbase/pocketbase" ]; then
        chmod +x apps/pocketbase/pocketbase
        echo "✅ PocketBase binary permissions set"
    else
        echo "⚠️  PocketBase binary not found"
    fi
    
    # Set execute permission for all shell scripts
    find . -name "*.sh" -type f -exec chmod +x {} \;
    echo "✅ Shell scripts permissions set"
    
    # Ensure node_modules binaries are executable
    if [ -d "node_modules/.bin" ]; then
        chmod +x node_modules/.bin/*
        echo "✅ Node modules binaries permissions set"
    fi
    
    echo ""
    echo "🎉 Setup completed!"
    echo ""
    echo "You can now run:"
    echo "  npm run start"
    echo ""
else
    echo "⚠️  Not running on Linux. Permission setup skipped."
    echo "   This script is meant for Linux production servers."
    echo ""
fi
