# 🏗️ Independent Apps Setup

## Overview

Setiap app sekarang **standalone** dengan `node_modules` sendiri dan bisa di-build/start secara independen.

## Directory Structure

```
Al-Amanah-V1/
├── apps/
│   ├── web/              # Vite + React frontend
│   │   ├── package.json  # Web dependencies & scripts
│   │   ├── node_modules/ # Web-specific dependencies
│   │   └── ...
│   ├── api/              # Express.js backend
│   │   ├── package.json  # API dependencies & scripts
│   │   ├── node_modules/ # API-specific dependencies
│   │   └── ...
│   └── pocketbase/       # PocketBase server
│       ├── package.json  # PocketBase dependencies & scripts
│       ├── node_modules/ # PocketBase-specific dependencies
│       └── ...
├── package.json          # Root orchestrator (optional)
└── dist/
    └── apps/web/         # Build output
```

## Installation

### Option 1: Install All at Once (Recommended)

```bash
# From root directory
npm run setup
```

This will:

- Install root dependencies
- Install web dependencies (`apps/web/node_modules/`)
- Install API dependencies (`apps/api/node_modules/`)
- Install PocketBase dependencies (`apps/pocketbase/node_modules/`)

### Option 2: Install Individually

```bash
# Install web only
cd apps/web
npm install

# Install API only
cd apps/api
npm install

# Install PocketBase only
cd apps/pocketbase
npm install
```

## Build Commands

### From Root Directory (Orchestrator)

```bash
# Build web only
npm run build

# Or
npm run build:web
```

### From Individual App Directories

#### Web App

```bash
cd apps/web

# Build
npm run build

# Build with clean
npm run clean && npm run build

# See output
npx vite build --outDir ../../dist/apps/web
```

#### API Server

```bash
cd apps/api

# No build needed (Node.js)
# Just start
npm run start
```

#### PocketBase

```bash
cd apps/pocketbase

# No build needed (binary)
# Just start
npm run start
```

## Start Commands

### From Root Directory

```bash
# Start all services
npm run start

# Start individual services
npm run start:web        # Web frontend
npm run start:api        # API server
npm run start:pocketbase # PocketBase
```

### From Individual Directories

#### Web App

```bash
cd apps/web

# Development (with hot reload)
npm run dev

# Production (serve built files)
npm run start
# or
npm run preview
```

#### API Server

```bash
cd apps/api

# Development
npm run dev

# Production
npm run start
```

#### PocketBase

```bash
cd apps/pocketbase

# Development
npm run dev

# Production
npm run start
```

## Available Scripts

### Web (`apps/web/package.json`)

```bash
npm run dev          # Development server (port 3000)
npm run build        # Build for production
npm run start        # Preview production build
npm run lint         # Run ESLint
npm run lint:warn    # Lint with warnings
npm run clean        # Remove dist folder
```

### API (`apps/api/package.json`)

```bash
npm run dev          # Development with trace
npm run start        # Production server (port 3001)
npm run lint         # Run ESLint
npm run clean        # Clear cache
```

### PocketBase (`apps/pocketbase/package.json`)

```bash
npm run dev                    # Development server (port 8090)
npm run start                  # Production server
npm run migrations:up          # Run migrations
npm run migrations:revert      # Revert last migration
npm run migrations:snapshot    # Create collection snapshots
npm run update                 # Update PocketBase binary
npm run backup                 # Create backup
npm run clean                  # Clear logs
```

### Root (`package.json`)

```bash
npm run setup        # Install all dependencies
npm run install:all  # Same as setup
npm run dev          # Start all in development
npm run build        # Build web
npm run build:web    # Build web
npm run start        # Start all in production
npm run start:web    # Start web only
npm run start:api    # Start API only
npm run start:pocketbase  # Start PocketBase only
npm run lint         # Lint all
npm run clean        # Clean all
```

## Benefits of Independent Setup

### ✅ Advantages

1. **Isolated Dependencies**
   - Each app has its own `node_modules`
   - No version conflicts between apps
   - Smaller deployment packages

2. **Independent Builds**
   - Build web without affecting API
   - Deploy individual apps
   - Faster CI/CD pipelines

3. **Flexible Development**
   - Work on web only: `cd apps/web && npm run dev`
   - Work on API only: `cd apps/api && npm run dev`
   - No need to start all services

4. **Easier Debugging**
   - Isolate issues to specific app
   - Restart individual services
   - Clear cache per app

5. **Better Caching**
   - CI/CD caches each app separately
   - Faster installs (only changed apps)
   - Smaller Docker images

### ⚠️ Considerations

1. **More Commands**
   - Need to `cd` into each directory
   - Separate install commands
   - Root orchestrator helps

2. **Disk Space**
   - Multiple `node_modules` folders
   - ~500MB total vs ~300MB shared
   - Trade-off for isolation

## Common Workflows

### Development

```bash
# Terminal 1 - Web
cd apps/web
npm run dev

# Terminal 2 - API
cd apps/api
npm run dev

# Terminal 3 - PocketBase
cd apps/pocketbase
npm run dev
```

### Or use root orchestrator:

```bash
# Start all in one command
npm run dev
```

### Production Build & Deploy

```bash
# Build web
cd apps/web
npm run build

# Verify build
Get-ChildItem ../../dist/apps/web -Recurse -File

# Deploy dist/apps/web/ to server
# Deploy apps/api/ to server
# Deploy apps/pocketbase/ to server
```

### Full Setup (Fresh Install)

```bash
# From root
npm run setup

# Verify installations
cd apps/web && npm list --depth=0
cd ../api && npm list --depth=0
cd ../pocketbase && npm list --depth=0
```

### Clean Rebuild

```bash
# Clean everything
npm run clean

# Rebuild web
cd apps/web
npm run clean
npm run build
```

## Troubleshooting

### Module Not Found

```bash
# Make sure you're in the right directory
cd apps/web
npm install
```

### Version Conflicts

```bash
# Each app has independent dependencies
# Check versions separately:
cd apps/web && npm list vite
cd ../api && npm list express
```

### Build Fails

```bash
# Clean and rebuild
cd apps/web
rm -rf node_modules
npm install
npm run build
```

### Port Already in Use

```bash
# Each app runs on different port:
# Web: 3000
# API: 3001
# PocketBase: 8090

# Kill process on port
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in package.json
```

## Migration from Shared Setup

If migrating from shared `node_modules`:

```bash
# 1. Remove root node_modules
rm -rf node_modules

# 2. Install in each app
cd apps/web && npm install
cd ../api && npm install
cd ../pocketbase && npm install

# 3. Test builds
cd ../web && npm run build
cd ../api && npm run start
cd ../pocketbase && npm run start

# 4. Update CI/CD to install per app
```

## Summary

| Task                   | Command         | Location           |
| ---------------------- | --------------- | ------------------ |
| **Install All**        | `npm run setup` | Root               |
| **Install Web**        | `npm install`   | apps/web           |
| **Install API**        | `npm install`   | apps/api           |
| **Install PocketBase** | `npm install`   | apps/pocketbase    |
| **Build Web**          | `npm run build` | apps/web (or root) |
| **Dev All**            | `npm run dev`   | Root               |
| **Start All**          | `npm run start` | Root               |
| **Dev Web Only**       | `npm run dev`   | apps/web           |
| **Start API Only**     | `npm run start` | apps/api           |

**Key Principle:** Each app is independent. Use root orchestrator for convenience, or work directly in app directories for full control.
