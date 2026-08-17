# 🚀 Quick Reference - Independent Apps

## Setup (First Time)

```bash
# Install all dependencies
npm run setup
```

## Daily Development

```bash
# Start all services (web + api + pocketbase)
npm run dev

# Or start individually
cd apps/web && npm run dev
cd apps/api && npm run dev
cd apps/pocketbase && npm run dev
```

## Build & Deploy

```bash
# Build web for production
npm run build

# Start all in production
npm run start

# Or start individually
cd apps/web && npm run start
cd apps/api && npm run start
cd apps/pocketbase && npm run start
```

## App-Specific Commands

### Web (Vite + React)

```bash
cd apps/web
npm run dev      # Dev server :3000
npm run build    # Build to ../../dist/apps/web
npm run start    # Preview production
npm run clean    # Remove build
```

### API (Express.js)

```bash
cd apps/api
npm run dev      # Dev server :3001
npm run start    # Production server
npm run clean    # Clear cache
```

### PocketBase

```bash
cd apps/pocketbase
npm run dev                    # Dev server :8090
npm run start                  # Production server
npm run migrations:up          # Run migrations
npm run migrations:revert      # Revert migration
npm run migrations:snapshot    # Create snapshot
npm run update                 # Update binary
npm run backup                 # Create backup
npm run clean                  # Clear logs
```

## Common Tasks

### Clean Rebuild

```bash
npm run clean
npm run build
```

### Lint All

```bash
npm run lint
```

### Fresh Install

```bash
# Remove all node_modules
rm -rf node_modules apps/web/node_modules apps/api/node_modules apps/pocketbase/node_modules

# Reinstall
npm run setup
```

## Ports

| Service    | Port | URL                   |
| ---------- | ---- | --------------------- |
| Web (dev)  | 3000 | http://localhost:3000 |
| API        | 3001 | http://localhost:3001 |
| PocketBase | 8090 | http://localhost:8090 |

## Node.js Versions

- **Minimum:** 18.0.0
- **Recommended:** 20.x or 22.x LTS

## File Locations

```
apps/web/           → Frontend source
apps/api/           → Backend source
apps/pocketbase/    → Database server
dist/apps/web/      → Built frontend
```

## Dependencies

Each app has its own `node_modules`:

- `apps/web/node_modules/`
- `apps/api/node_modules/`
- `apps/pocketbase/node_modules/`

## Benefits

✅ Independent installs  
✅ Separate builds  
✅ No version conflicts  
✅ Faster CI/CD  
✅ Easier debugging

## Need Help?

See full documentation: `docs/INDEPENDENT-APPS.md`
