# 🚀 Deployment Guide

## Quick Start

### 1. Build Locally (Optional)

```bash
npm run build
```

### 2. Deploy to Server

```bash
# Upload files to server
scp -r . user@server:/var/www/html/masjid

# SSH to server
ssh user@server
cd /var/www/html/masjid
```

### 3. Setup on Server

```bash
# Install dependencies
npm install --production

# Set permissions
bash deploy/post-deploy-setup.sh

# Build (if not built locally)
bash deploy/build.sh

# Start services
npm run start
```

## Manual Deployment Steps

### Step 1: Upload Files

```bash
# Required files/folders:
- dist/                    # Built web app
- apps/api/               # API server
- apps/pocketbase/        # PocketBase + data
- node_modules/           # Dependencies
- package.json            # Root package
- .env                    # Environment variables (create on server)
```

### Step 2: Create .env File

```bash
# apps/api/.env
PORT=3001
DATABASE_URL=your_database_url

# apps/pocketbase/.env
PB_ENCRYPTION_KEY=your_encryption_key
```

### Step 3: Set Permissions

```bash
chmod +x apps/pocketbase/pocketbase
chmod +x deploy/*.sh
```

### Step 4: Start Services

```bash
# Development
npm run start

# Production with PM2
pm2 start ecosystem.config.cjs
```

## Using PM2 (Recommended for Production)

### Install PM2

```bash
npm install -g pm2
```

### Start Services

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Monitor

```bash
pm2 status
pm2 logs
pm2 monit
```

## Troubleshooting

### Build Error: ENOENT

```bash
# Wrong path in build script
# Solution: Use workspace command
npm run build --workspace=apps/web
```

### Permission Denied

```bash
# PocketBase binary not executable
chmod +x apps/pocketbase/pocketbase
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001
lsof -i :8090

# Kill process
kill -9 <PID>
```

### Services Won't Start

```bash
# Check logs
pm2 logs
# or
npm run start  # Run in foreground to see errors
```

## Nginx Configuration

See `deploy/nginx.conf` for complete reverse proxy setup with:

- SSL termination
- Gzip compression
- Caching
- Rate limiting
- WebSocket support

## Health Check

```bash
# Web
curl http://localhost:3000

# API
curl http://localhost:3001/api/health

# PocketBase
curl http://localhost:8090/api/health
```

## Backup & Restore

### Backup PocketBase Data

```bash
tar -czf pb_backup_$(date +%Y%m%d).tar.gz apps/pocketbase/pb_data/
```

### Restore

```bash
tar -xzf pb_backup_20260817.tar.gz -C apps/pocketbase/
```

## Update Deployment

```bash
# Pull latest code
git pull

# Install new dependencies
npm install --production

# Rebuild
npm run build

# Set permissions
bash deploy/post-deploy-setup.sh

# Restart services
pm2 restart all
# or
npm run start
```

## Security Checklist

- [ ] Change default PocketBase admin password
- [ ] Set strong PB_ENCRYPTION_KEY
- [ ] Enable SSL (Let's Encrypt)
- [ ] Configure firewall (ufw)
- [ ] Set up regular backups
- [ ] Monitor logs
- [ ] Update system packages regularly
- [ ] Restrict database access
- [ ] Use environment variables for secrets
